// Hàm thuần cho form Create Course: không đụng Vue / Supabase
// Quy tắc đặt tên, quý và kiểm tra dữ liệu nằm ở courseRules.js (dùng chung với server)
import { validateCoursePayload } from './courseRules.js'

// Dòng tbl_subject -> item cho ô chọn môn học.
// value = mã môn (Course Schedule dùng để khớp khóa theo '<mã môn>_Q'); key = '<prg>|<mã môn>' vì cùng mã có thể ở nhiều program
export const toSubjectOptions = (rows = []) =>
  rows.map(r => ({
    key: `${r.prg || ''}|${r.subj_code}`,
    value: r.subj_code,
    prg: r.prg || '',
    title: `${r.subj_code} - ${r.obj_json?.SubjName || ''}${r.prg ? ` (${r.prg})` : ''}`,
    subjName: r.obj_json?.SubjName || '',
    type: r.obj_json?.Type || ''
  }))

const num = (v) => Number(v) || 0

const toCourseLecturerJson = (l) => ({
  email: l.lecturer.email,
  name: l.lecturer.name,
  role: l.role,
  cost_up: num(l.cost_up),
  cost_qty: num(l.cost_qty),
  noofsection: num(l.noofsection)
})

// Form + môn đã chọn -> dữ liệu gửi lên API (bỏ các dòng chưa chọn giảng viên). Domain do server xác nhận lại.
export const toCreateCoursePayload = (f, subject, domain) => ({
  domain,
  subjCode: subject?.value || '',
  prg: subject?.prg || '',
  quarter: f.quarter,
  coef: Number(f.coef),
  lecturers: f.lecturers.filter(l => l.lecturer?.email).map(toCourseLecturerJson)
})

// Kiểm tra payload ở trình duyệt (server kiểm tra lại bằng cùng hàm), trả về chuỗi lỗi (rỗng nếu hợp lệ)
export const validateCourseForm = (payload) => validateCoursePayload(payload)

const ERROR_MESSAGES = {
  COURSE_DUPLICATED: 'A course with this name already exists.',
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
