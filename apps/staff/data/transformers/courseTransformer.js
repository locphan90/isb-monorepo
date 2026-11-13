// Hàm thuần cho form Create Course: không đụng Vue / Supabase
// Quy tắc đặt tên, quý và kiểm tra dữ liệu nằm ở courseRules.js (dùng chung với server)
import { emptyCourseLecturer } from '../schemas/courseSchema.js'
import { validateCoursePayload, validateCourseUpdate, isValidProgram, resolveProgram } from './courseRules.js'

// Dòng tbl_subject -> item cho ô chọn môn học.
// value = mã môn (Course Schedule dùng để khớp khóa theo '<mã môn>_Q'); key = '<prg>|<mã môn>' vì cùng mã có thể ở nhiều dòng
// prg = giá trị cột prg của môn; programOk = prg có phải program hợp lệ của domain không (môn cũ lưu tên domain thì không):
// chỉ khi hợp lệ mới hiện trong tên và dùng làm program của lớp
export const toSubjectOptions = (rows = [], domain = '') =>
  rows.map(r => {
    const programOk = isValidProgram(domain, r.prg)
    return {
      key: `${r.prg || ''}|${r.subj_code}`,
      value: r.subj_code,
      prg: r.prg || '',
      programOk,
      title: `${r.subj_code} - ${r.obj_json?.SubjName || ''}${programOk ? ` (${r.prg})` : ''}`,
      subjName: r.obj_json?.SubjName || '',
      type: r.obj_json?.Type || ''
    }
  })

const num = (v) => Number(v) || 0

const toCourseLecturerJson = (l) => ({
  email: l.lecturer.email,
  name: l.lecturer.name,
  role: l.role,
  cost_up: num(l.cost_up),
  cost_qty: num(l.cost_qty),
  noofsection: num(l.noofsection)
})

// Khóa trong danh sách (API /api/course/list) -> dữ liệu form sửa. Luôn có ít nhất một dòng giảng viên để nhập
export const courseToEditForm = (c) => ({
  coef: c.coef ?? 1,
  pic: c.pic || '',
  lecturers: (c.lecturers || []).length
    ? c.lecturers.map(l => ({
        lecturer: { email: l.email, name: l.name || l.email },
        role: l.role || 'Lecturer',
        cost_up: num(l.cost_up),
        cost_qty: num(l.cost_qty),
        noofsection: num(l.noofsection)
      }))
    : [emptyCourseLecturer()]
})

// Form sửa -> dữ liệu gửi lên /api/course/update (bỏ các dòng chưa chọn giảng viên). Domain do server xác nhận lại.
export const toUpdateCoursePayload = (id, f, domain) => ({
  id,
  domain,
  coef: Number(f.coef),
  pic: String(f.pic || '').trim(),
  lecturers: f.lecturers.filter(l => l.lecturer?.email).map(toCourseLecturerJson)
})

export const validateCourseEditForm = (payload) => validateCourseUpdate(payload)

// Form + môn đã chọn -> dữ liệu gửi lên API (bỏ các dòng chưa chọn giảng viên). Domain do server xác nhận lại.
// prg = cột prg của môn (để server tìm đúng môn); program = program dùng đặt tên lớp (prg của môn nếu hợp lệ, không thì program đã chọn)
export const toCreateCoursePayload = (f, subject, domain) => ({
  domain,
  subjCode: subject?.value || '',
  prg: subject?.prg || '',
  program: resolveProgram(domain, subject?.prg, f.program),
  className: f.class_name,
  quarter: f.quarter,
  coef: Number(f.coef),
  pic: String(f.pic || '').trim(),
  lecturers: f.lecturers.filter(l => l.lecturer?.email).map(toCourseLecturerJson)
})

// Kiểm tra payload ở trình duyệt (server kiểm tra lại bằng cùng hàm), trả về chuỗi lỗi (rỗng nếu hợp lệ)
export const validateCourseForm = (payload) => validateCoursePayload(payload)

const ERROR_MESSAGES = {
  COURSE_DUPLICATED: 'A course with this name already exists.',
  COURSE_NOT_FOUND: 'This course no longer exists. Please reload the list.',
  COURSE_NAME_EXHAUSTED: 'Too many classes already use this name. Please contact the administrator.',
  SUBJECT_NOT_FOUND: 'This subject is no longer available. Please reload the page.',
  DOMAIN_NOT_ALLOWED: 'You do not have access to this domain.',
  FORBIDDEN: 'You do not have permission to do this.',
  INVALID_BODY: 'Invalid data.',
  INVALID_VALUE: 'Invalid data.'
}

export const courseErrorMessage = (e) => {
  const text = [e?.data?.statusMessage, e?.statusMessage, e?.message].filter(Boolean).join(' | ')
  const code = Object.keys(ERROR_MESSAGES).find((c) => text.includes(c))
  if (code) return ERROR_MESSAGES[code]
  if (e?.data?.statusMessage && e.data.statusMessage.startsWith('INVALID:')) return e.data.statusMessage.slice(8).trim()
  return 'Something went wrong. Please try again.'
}
