// Hàm thuần cho lịch học: không đụng Vue / Supabase. Ngày xử lý bằng #core/data/transformers/scheduleDates.
import { datesOnWeekdays } from '#core/data/transformers/scheduleDates'
import { emptySession, SCHEDULE_ROOM_MAX, SCHEDULE_NOTE_MAX } from '../schemas/courseScheduleSchema'

let seq = 0
const nextKey = () => `s${++seq}` // khóa tạm để Vue phân biệt các buổi (kể cả buổi chưa có id)

const FIELDS = ['date', 'start', 'end', 'room', 'lecturerEmail', 'note']

// Buổi từ server -> buổi trong form
export const fromServerSession = (s) => ({
  _key: nextKey(),
  id: s.id,
  date: s.date,
  start: s.start || '',
  end: s.end || '',
  room: s.room || '',
  lecturerEmail: s.lecturerEmail || '',
  note: s.note || '',
})

// Buổi mới, điền sẵn theo mẫu (phòng, giờ, giảng viên, ghi chú) người dùng đã nhập ở khung lập nhanh
export const newSession = (date, defaults = {}) => ({
  _key: nextKey(),
  ...emptySession(date),
  start: defaults.start || '',
  end: defaults.end || '',
  room: defaults.room || '',
  lecturerEmail: defaults.lecturerEmail || '',
  note: defaults.note || '',
})

// Các buổi cần thêm cho những thứ đã chọn (mặc định các ngày chưa có buổi nào cùng giờ bắt đầu)
export const sessionsForWeekdays = (course, weekdays, defaults, existing) => {
  const taken = new Set(existing.filter((s) => !s._removed).map(slotKey))
  return datesOnWeekdays(course.startDate, course.endDate, weekdays)
    .filter((date) => !taken.has(`${date}|${defaults.start || '00:00'}`))
    .map((date) => newSession(date, defaults))
}

export const slotKey = (s) => `${s.date}|${s.start || '00:00'}`

export const sortSessions = (a, b) => a.date.localeCompare(b.date) || (a.start || '').localeCompare(b.start || '')

const sameData = (a, b) => FIELDS.every((f) => (a[f] || '') === (b[f] || ''))

// So sánh bản gốc (từ server) với bản đang sửa -> payload gửi server + trạng thái từng buổi
//   original: [session có id] đã chuẩn hóa bằng fromServerSession
//   current : [session] (có thể có _removed: true)
export const diffSchedule = (original, current) => {
  const originalById = new Map(original.map((s) => [s.id, s]))
  const upserts = []
  const deletes = []
  const state = new Map() // _key -> 'new' | 'edited' | 'saved'

  for (const s of current) {
    if (s._removed) {
      if (s.id) deletes.push(s.id)
      continue
    }
    if (!s.id) {
      upserts.push(toPayload(s))
      state.set(s._key, 'new')
    } else if (!sameData(s, originalById.get(s.id) || {})) {
      upserts.push(toPayload(s))
      state.set(s._key, 'edited')
    } else {
      state.set(s._key, 'saved')
    }
  }

  const counts = {
    added: [...state.values()].filter((v) => v === 'new').length,
    edited: [...state.values()].filter((v) => v === 'edited').length,
    removed: deletes.length,
  }
  return { upserts, deletes, state, counts, hasChanges: upserts.length + deletes.length > 0 }
}

const toPayload = (s) => ({
  ...(s.id ? { id: s.id } : {}),
  date: s.date,
  start: s.start || '',
  end: s.end || '',
  room: (s.room || '').trim(),
  lecturerEmail: s.lecturerEmail || '',
  note: (s.note || '').trim(),
})

// Kiểm tra trước khi lưu, trả chuỗi lỗi (rỗng nếu hợp lệ)
export const validateSchedule = (sessions, course) => {
  const seen = new Set()
  for (const s of sessions.filter((x) => !x._removed)) {
    if (s.date < course.startDate || s.date > course.endDate) return `${s.date} is outside the course period.`
    if (s.end && !s.start) return `${s.date}: please enter a start time before the end time.`
    if (s.start && s.end && s.end <= s.start) return `${s.date}: end time must be after start time.`
    if ((s.room || '').length > SCHEDULE_ROOM_MAX) return `${s.date}: room name is too long.`
    if ((s.note || '').length > SCHEDULE_NOTE_MAX) return `${s.date}: note is too long (max ${SCHEDULE_NOTE_MAX} characters).`
    const k = slotKey(s)
    if (seen.has(k)) return `${s.date}: two sessions start at the same time.`
    seen.add(k)
  }
  return ''
}

// Chỉ giữ khóa thuộc môn của domain đang chọn: course_name = <subj_code>_Q<quý><năm>_<lớp>
export const courseMatchesSubjects = (courseName, subjectCodes) =>
  subjectCodes.some((code) => courseName.startsWith(`${code}_Q`))

// Lỗi từ API -> câu thông báo cho người dùng
const ERROR_MESSAGES = {
  FORBIDDEN: 'You do not have permission to do this.',
  COURSE_NOT_FOUND: 'This course no longer exists.',
  INVALID_COURSE: 'The course is not valid.',
  INVALID_DATE: 'One of the dates is not valid.',
  DATE_OUT_OF_RANGE: 'A session is outside the course period.',
  INVALID_TIME: 'One of the times is not valid. The end time must be after the start time.',
  INVALID_LECTURER: 'One of the selected lecturers is not an active lecturer.',
  INVALID_VALUE: 'One of the values is not valid.',
  DUPLICATE_SESSION: 'Two sessions of this course start on the same day at the same time.',
  SESSION_NOT_FOUND: 'A session was changed or removed by someone else. Reload the course and try again.',
  NO_CHANGES: 'There is nothing to save.',
  TOO_MANY_CHANGES: 'Too many changes at once. Please save in smaller parts.',
  DB_ERROR: 'The server could not process the request. Please try again.',
}

export const scheduleErrorMessage = (e) => {
  const text = [e?.data?.statusMessage, e?.statusMessage, e?.message].filter(Boolean).join(' | ')
  const code = Object.keys(ERROR_MESSAGES).find((c) => text.includes(c))
  return code ? ERROR_MESSAGES[code] : 'Something went wrong. Please try again.'
}

export const isUnauthorized = (e) => (e?.statusCode ?? e?.status) === 401
