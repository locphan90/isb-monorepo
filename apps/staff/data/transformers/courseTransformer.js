// Hàm thuần: không đụng Vue / Supabase
import { COURSE_STATUS } from '../schemas/courseSchema'

// Quý học: Q + số quý + 2 số cuối của năm. Ví dụ quý 1 năm 2026 -> Q126
export const buildQuarterCode = (quarter, year) => `Q${quarter}${String(year).slice(-2)}`

// Tên lớp: bỏ khoảng trắng và dấu gạch dưới để không phá định dạng course_name
export const cleanClassName = (v) => String(v || '').replace(/[\s_]/g, '')

// course_name = subj_code + '_' + quý + '_' + lớp. Ví dụ: AB_Q126_T1
export const buildCourseName = ({ subj_code, quarter, year, class_name }) => {
  const cls = cleanClassName(class_name)
  if (!subj_code || !quarter || !year || !cls) return ''
  return `${subj_code}_${buildQuarterCode(quarter, year)}_${cls}`
}

// Dòng tbl_subject -> item cho ô chọn môn học
export const toSubjectOptions = (rows = []) =>
  rows.map(r => ({
    value: r.subj_code,
    title: `${r.subj_code} - ${r.obj_json?.SubjName || ''}`,
    subjName: r.obj_json?.SubjName || ''
  }))

// Kiểm tra form, trả về chuỗi lỗi (rỗng nếu hợp lệ)
export const validateCourseForm = (f) => {
  if (!f.subj_code) return 'Please select a subject.'
  if (!cleanClassName(f.class_name)) return 'Please enter the class.'
  if (!(Number(f.coef) > 0)) return 'Coefficient must be greater than 0.'
  if (!f.startdate || !f.enddate) return 'Please select start date and end date.'
  if (new Date(f.enddate) < new Date(f.startdate)) return 'End date must not be before start date.'
  return ''
}

const num = (v) => Number(v) || 0

const toCourseLecturerJson = (l) => ({
  email: l.lecturer.email,
  name: l.lecturer.name,
  role: l.role,
  cost_up: num(l.cost_up),
  cost_qty: num(l.cost_qty),
  noofsection: num(l.noofsection)
})

// Form -> dòng insert vào tbl_course (bỏ các dòng chưa chọn giảng viên)
export const toCourseRow = (f, subjName, userEmail) => {
  const now = new Date().toISOString()
  return {
    course_name: buildCourseName(f),
    subject: subjName,
    coef: Number(f.coef),
    startdate: f.startdate,
    enddate: f.enddate,
    obj_lecturer: f.lecturers.filter(l => l.lecturer?.email).map(toCourseLecturerJson),
    i_status: COURSE_STATUS.ACTIVE,
    create_at: now,
    create_by: userEmail,
    update_at: now
  }
}