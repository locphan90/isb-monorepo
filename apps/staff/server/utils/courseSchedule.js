// server/utils/courseSchedule.js
// Kiểm tra và làm sạch dữ liệu lưu lịch học. Mọi thứ client gửi lên đều bị kiểm tra lại ở đây.
import {
  SCHEDULE_ROOM_MAX, SCHEDULE_NOTE_MAX, SCHEDULE_MAX_CHANGES_PER_SAVE,
} from '~/data/schemas/courseScheduleSchema'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const bad = (code) => createError({ statusCode: 400, statusMessage: code })

// 'YYYY-MM-DD' có phải ngày có thật không (loại 2026-02-30)
const isRealDate = (s) => {
  if (!DATE_RE.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}

// Ngày hôm nay theo giờ Việt Nam (YYYY-MM-DD)
export const todayVN = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())

// start_date / end_date của tbl_course là kiểu date ('YYYY-MM-DD'); cắt 10 ký tự đầu cho chắc
export const toDateOnly = (v) => (v ? String(v).slice(0, 10) : '')

// Khóa học xác định bằng tbl_course.id (số nguyên dương)
export const parseCourseId = (v) => {
  const n = Number(v)
  if (!Number.isSafeInteger(n) || n <= 0) throw bad('INVALID_COURSE')
  return n
}

// body: { course, upserts: [{ id?, date, start, end, room, lecturerEmail, note }], deletes: [id] }
// course:    { startDate, endDate } của khóa (lấy từ DB)
// lecturers: Map email(thường) -> tên, gồm giảng viên đang hoạt động
// Trả về { upserts, deletes } đã làm sạch, sẵn sàng gửi vào hàm save_course_schedule
export const parseScheduleSave = (body, course, lecturers) => {
  const rawUpserts = Array.isArray(body?.upserts) ? body.upserts : []
  const rawDeletes = Array.isArray(body?.deletes) ? body.deletes : []
  if (rawUpserts.length + rawDeletes.length === 0) throw bad('NO_CHANGES')
  if (rawUpserts.length + rawDeletes.length > SCHEDULE_MAX_CHANGES_PER_SAVE) throw bad('TOO_MANY_CHANGES')

  const toId = (v) => {
    const n = Number(v)
    if (!Number.isSafeInteger(n) || n <= 0) throw bad('INVALID_BODY')
    return n
  }

  const deletes = [...new Set(rawDeletes.map(toId))]
  const seen = new Set()

  const upserts = rawUpserts.map((u) => {
    const id = u?.id === undefined || u?.id === null || u?.id === '' ? null : toId(u.id)
    const date = String(u?.date ?? '')
    const start = String(u?.start ?? '').trim()
    const end = String(u?.end ?? '').trim()
    const room = String(u?.room ?? '').trim()
    const note = String(u?.note ?? '').trim()
    const email = String(u?.lecturerEmail ?? '').trim().toLowerCase()

    if (!isRealDate(date)) throw bad('INVALID_DATE')
    if (date < course.startDate || date > course.endDate) throw bad('DATE_OUT_OF_RANGE')
    if (start && !TIME_RE.test(start)) throw bad('INVALID_TIME')
    if (end && !TIME_RE.test(end)) throw bad('INVALID_TIME')
    if (end && !start) throw bad('INVALID_TIME')
    if (start && end && end <= start) throw bad('INVALID_TIME')
    if (room.length > SCHEDULE_ROOM_MAX || note.length > SCHEDULE_NOTE_MAX) throw bad('INVALID_VALUE')
    if (email && !lecturers.has(email)) throw bad('INVALID_LECTURER')

    // Hai buổi trùng ngày + giờ bắt đầu trong cùng một lần lưu
    const slot = `${date}|${start || '00:00'}`
    if (seen.has(slot)) throw createError({ statusCode: 409, statusMessage: 'DUPLICATE_SESSION' })
    seen.add(slot)

    return {
      ...(id ? { id } : {}),
      date,
      start,
      end,
      room,
      lecturerEmail: email,
      lecturerName: email ? lecturers.get(email) : '',
      note,
    }
  })

  const upsertIds = new Set(upserts.filter((u) => u.id).map((u) => u.id))
  if (deletes.some((id) => upsertIds.has(id))) throw bad('INVALID_BODY')
  if (upsertIds.size !== upserts.filter((u) => u.id).length) throw bad('INVALID_BODY') // cùng id hai lần

  return { upserts, deletes }
}

// tbl_course không có cột domain nên khóa thuộc domain nào được suy ra từ môn học:
// course_name = <subj_code>_Q<quý><năm>_<lớp>, subj_code thuộc tbl_subject của domain đó.
// Trả về mảng subj_code của các domain truyền vào (domains lấy từ requireAdminAccess, không từ client).
export const loadDomainSubjectCodes = async (event, domains) => {
  if (!domains?.length) return []
  const { data, error } = await useSupabaseAdmin(event)
    .from('tbl_subject')
    .select('subj_code')
    .in('domain', domains)
  if (error) {
    console.error('[course-schedule] subject query failed:', error.message)
    throw createError({ statusCode: 500, statusMessage: 'DB_ERROR' })
  }
  return (data || []).map((r) => r.subj_code).filter(Boolean)
}

// Khóa có thuộc domain của user không (subjectCodes từ loadDomainSubjectCodes)
// (Không import từ data/transformers vì file đó dùng alias #core/ mà server không resolve được; quy tắc giống courseMatchesSubjects ở đó)
export const courseInDomain = (courseName, subjectCodes) =>
  subjectCodes.some((code) => String(courseName || '').startsWith(`${code}_Q`))

// Chặn thao tác trên khóa của domain khác
export const assertCourseInDomain = async (event, course, domains) => {
  if (!courseInDomain(course.courseName, await loadDomainSubjectCodes(event, domains))) {
    throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })
  }
}

// Giảng viên đang hoạt động (tbl_lecturer): Map email(thường) -> tên. Chỉ lấy email + tên, không lấy phần hồ sơ còn lại.
export const loadActiveLecturers = async (event) => {
  const { data, error } = await useSupabaseAdmin(event)
    .from('tbl_lecturer')
    .select('email, full_name')
    .eq('i_status', 0)
  if (error) {
    console.error('[course-schedule] lecturer query failed:', error.message)
    throw createError({ statusCode: 500, statusMessage: 'DB_ERROR' })
  }
  return new Map((data || []).map((r) => [String(r.email).trim().toLowerCase(), r.full_name || r.email]))
}

// Khóa còn dùng theo id; null nếu không có (hoặc đã xóa mềm)
export const loadActiveCourse = async (event, courseId) => {
  const { data, error } = await useSupabaseAdmin(event)
    .from('tbl_course')
    .select('id, course_name, subject, start_date, end_date, obj_lecturer')
    .eq('id', courseId)
    .eq('i_status', 0)
    .limit(1)
  if (error) {
    console.error('[course-schedule] course query failed:', error.message)
    throw createError({ statusCode: 500, statusMessage: 'DB_ERROR' })
  }
  const row = data?.[0]
  return row ? toCourseInfo(row) : null
}

// obj_lecturer là mảng giảng viên; khóa tạo không qua form có thể là {} (giá trị mặc định của cột) nên coi như rỗng
export const toCourseInfo = (row) => ({
  id: Number(row.id),
  courseName: row.course_name,
  subject: row.subject || '',
  startDate: toDateOnly(row.start_date),
  endDate: toDateOnly(row.end_date),
  lecturers: (Array.isArray(row.obj_lecturer) ? row.obj_lecturer : [])
    .filter((l) => l?.email)
    .map((l) => ({ email: String(l.email).trim().toLowerCase(), name: l.name || l.email, role: l.role || '' })),
})
