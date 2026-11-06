// Quy tắc tạo khóa học (hàm thuần: không đụng Vue / Supabase). Dùng cả ở trình duyệt (xem trước, kiểm tra)
// lẫn server (kiểm tra lại, dựng tên) nên import tương đối PHẢI có đuôi .js.
import { isQuarter } from './subjectTransformer.js'
import { COURSE_LECTURER_ROLES } from '../schemas/courseSchema.js'

const pad = (n) => String(n).padStart(2, '0')
const str = (v) => String(v ?? '').trim()

// '2026Q4' -> 'Q426' (Q + số quý + 2 số cuối của năm)
export const quarterCode = (quarter) => `Q${quarter.slice(5, 6)}${quarter.slice(2, 4)}`

// '2026Q4' -> { start: '2026-10-01', end: '2026-12-31' }: khóa kéo dài cả quý (form không nhập ngày)
export const quarterRange = (quarter) => {
  const year = Number(quarter.slice(0, 4))
  const startMonth = (Number(quarter.slice(5, 6)) - 1) * 3 + 1
  const endMonth = startMonth + 2
  const lastDay = new Date(Date.UTC(year, endMonth, 0)).getUTCDate()
  return { start: `${year}-${pad(startMonth)}-01`, end: `${year}-${pad(endMonth)}-${pad(lastDay)}` }
}

// Ký tự đầu của program, in hoa: 'Talent' -> 'T', 'PSO' -> 'P'
export const prgLetter = (prg) => str(prg).charAt(0).toUpperCase()

// ── Cách đặt tên lớp theo domain ─────────────────────────────────────────────
// Lớp = ký tự đầu của PROGRAM của môn học + SỐ THỨ TỰ (số do DB cấp, tăng dần nếu trùng); không còn nhập tay.
//   prefix(...) trả về phần đứng trước số, ví dụ BAP_Q426_T -> BAP_Q426_T1, BAP_Q426_T2...
// COURSE_NAMING ghi đè cách đặt tên cho từng domain; domain không có trong bảng dùng DEFAULT_NAMING (hiện giống MBA).
// Thêm quy tắc riêng cho một domain: thêm một mục ở đây, không cần đổi SQL. Tên phải bắt đầu bằng '<mã môn>_Q'
// (trang Course Schedule và Enrollment của sinh viên khớp khóa với môn theo tiền tố này).
const programLetterRule = {
  prefix: ({ subjCode, quarter, prg }) => `${subjCode}_${quarterCode(quarter)}_${prgLetter(prg)}`,
}
export const DEFAULT_NAMING = programLetterRule
export const COURSE_NAMING = {
  MBA: programLetterRule,
}
export const namingFor = (domain) => COURSE_NAMING[domain] || DEFAULT_NAMING

// Kế hoạch đặt tên: { numbered: true, name: <tiền tố, chưa có số> } hoặc null nếu chưa đủ dữ liệu
export const courseNamePlan = ({ domain, subjCode, prg, quarter }) => {
  if (!str(subjCode) || !prgLetter(prg) || !isQuarter(str(quarter))) return null
  return { numbered: true, name: namingFor(domain).prefix({ subjCode: str(subjCode), quarter: str(quarter), prg }) }
}

// Số thứ tự nhỏ nhất chưa dùng cho một tiền tố, dựa trên danh sách tên khóa đang dùng (giống hàm SQL create_course)
export const nextSequence = (existingNames, prefix) => {
  const used = new Set()
  for (const n of existingNames) {
    if (!n.startsWith(prefix)) continue
    const rest = n.slice(prefix.length)
    if (/^[1-9]\d*$/.test(rest)) used.add(Number(rest))
  }
  let i = 1
  while (used.has(i)) i++
  return i
}

// Tên hiển thị khi xem trước ('' nếu chưa đủ dữ liệu); số của khóa mới chỉ là dự kiến, DB mới là nơi chốt
export const previewCourseName = (input, existingNames = []) => {
  const plan = courseNamePlan(input)
  return plan ? `${plan.name}${nextSequence(existingNames, plan.name)}` : ''
}

const MAX_LECTURERS = 30
const MAX_NUMBER = 1e9

// Kiểm tra dữ liệu tạo khóa (client và server dùng chung), trả về chuỗi lỗi (rỗng nếu hợp lệ).
// input: { domain, subjCode, prg, quarter, coef, lecturers: [{ email, name, role, cost_up, cost_qty, noofsection }] }
// Rate KHÔNG có trong dữ liệu gửi lên: DB tự tra theo loại môn và quý.
export const validateCoursePayload = (p) => {
  if (!str(p.subjCode)) return 'Please select a subject.'
  if (!prgLetter(p.prg)) return 'The selected subject has no program. Please set it in Subjects first.'
  if (!isQuarter(str(p.quarter))) return 'Please select a quarter.'
  const coef = Number(p.coef)
  if (!(coef > 0) || coef > 1000) return 'Coefficient must be greater than 0.'

  const lecturers = p.lecturers ?? []
  if (!Array.isArray(lecturers) || lecturers.length > MAX_LECTURERS) return 'Invalid lecturer list.'
  for (const l of lecturers) {
    if (!str(l?.email).includes('@') || !str(l?.name)) return 'Please select a lecturer for every row.'
    if (!COURSE_LECTURER_ROLES.includes(l.role)) return 'Invalid lecturer role.'
    for (const k of ['cost_up', 'cost_qty', 'noofsection']) {
      const v = Number(l[k])
      if (!Number.isFinite(v) || v < 0 || v > MAX_NUMBER) return 'Lecturer hourly rate, hours and sessions must be 0 or more.'
    }
  }
  return ''
}

// Kết quả tra Rate -> câu giải thích dưới ô Rate. info: null (chưa chọn đủ) | { loading } | { error } | { subjectType, rate }
export const rateHint = (info, quarter) => {
  if (!info) return { text: 'Select a subject and a quarter.', warn: false }
  if (info.loading) return { text: 'Loading…', warn: false }
  if (info.error) return { text: 'Could not load the rate.', warn: true }
  if (!info.subjectType) return { text: 'This subject has no type. Please set it in Subjects first.', warn: true }
  if (info.rate === null || info.rate === undefined) {
    return { text: `No ${info.subjectType} rate valid in ${quarter}. Add it in Rates, otherwise the course is created without a rate.`, warn: true }
  }
  return { text: `${info.subjectType} rate valid in ${quarter}`, warn: false }
}
