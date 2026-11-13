// Quy tắc tạo khóa học (hàm thuần: không đụng Vue / Supabase). Dùng cả ở trình duyệt (xem trước, kiểm tra)
// lẫn server (kiểm tra lại, dựng tên) nên import tương đối PHẢI có đuôi .js.
import { isQuarter } from './subjectTransformer.js'
import { COURSE_LECTURER_ROLES } from '../schemas/courseSchema.js'
import { PROGRAMS_BY_DOMAIN } from '../schemas/subjectSchema.js'

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

// ── Program ──────────────────────────────────────────────────────────────────
// "Program" là tên chương trình bên trong một domain (MBA, EAP: PSO / Talent; WSU: BBUS / BCOMM / BDATA), KHÔNG phải tên domain.
// Danh sách program theo domain nằm ở PROGRAMS_BY_DOMAIN (subjectSchema.js); domain không có danh sách thì không kiểm tra theo danh sách.
export const knownPrograms = (domain) => PROGRAMS_BY_DOMAIN[domain] || []

// Giá trị prg của môn học có phải một program hợp lệ không. Các môn cũ lưu tên domain (vd 'MBA') trong cột prg thì KHÔNG hợp lệ.
export const isValidProgram = (domain, prg) => {
  const p = str(prg)
  if (!p) return false
  const list = knownPrograms(domain)
  return list.length ? list.includes(p) : p.toLowerCase() !== str(domain).toLowerCase()
}

// Program dùng để đặt tên lớp: lấy prg của môn học nếu hợp lệ, không thì lấy program do người dùng chọn lúc tạo khóa
export const resolveProgram = (domain, subjectPrg, chosen) => (isValidProgram(domain, subjectPrg) ? str(subjectPrg) : str(chosen))

// ── Cách đặt tên lớp theo domain ─────────────────────────────────────────────
// mode 'program': lớp = ký tự đầu của PROGRAM + SỐ THỨ TỰ do DB cấp (tăng dần nếu trùng); không nhập tay.
//   prefix(...) trả về phần đứng trước số, ví dụ BAP_Q426_T -> BAP_Q426_T1, BAP_Q426_T2...
// mode 'manual': nhập tay ô Class, tên <mã môn>_<quý>_<lớp>, ví dụ AB_Q426_T1. Dùng cho domain chưa có quy tắc.
//   WSU tạm thời nhập tay vì BBUS, BCOMM, BDATA đều bắt đầu bằng B (ký tự đầu không phân biệt được); sẽ thay bằng quy tắc riêng.
// Thêm / đổi quy tắc cho một domain: sửa COURSE_NAMING ở đây, không cần đổi SQL. Tên phải bắt đầu bằng '<mã môn>_Q'
// (trang Course Schedule và Enrollment của sinh viên khớp khóa với môn theo tiền tố này).
const programLetterRule = {
  mode: 'program',
  prefix: ({ subjCode, quarter, program }) => `${subjCode}_${quarterCode(quarter)}_${prgLetter(program)}`,
}
const manualRule = { mode: 'manual' }
export const DEFAULT_NAMING = manualRule
export const COURSE_NAMING = {
  MBA: programLetterRule,
  EAP: programLetterRule, // cùng danh sách program (PSO / Talent) với MBA; đổi lại nếu EAP có quy tắc khác
  WSU: manualRule,
}
export const namingFor = (domain) => COURSE_NAMING[domain] || DEFAULT_NAMING
export const isProgramNaming = (domain) => namingFor(domain).mode === 'program'

// Tên lớp nhập tay: bỏ khoảng trắng và dấu gạch dưới để không phá định dạng course_name
export const cleanClassName = (v) => String(v || '').replace(/[\s_]/g, '')

// Kế hoạch đặt tên: { numbered, name } hoặc null nếu chưa đủ dữ liệu.
//   numbered = true : name là TIỀN TỐ (chưa có số, DB sẽ nối số)
//   numbered = false: name là TÊN ĐẦY ĐỦ
// input: { domain, subjCode, program, quarter, className }  (program: đã qua resolveProgram)
export const courseNamePlan = ({ domain, subjCode, program, quarter, className }) => {
  if (!str(subjCode) || !isQuarter(str(quarter))) return null
  const rule = namingFor(domain)
  if (rule.mode === 'program') {
    if (!prgLetter(program)) return null
    return { numbered: true, name: rule.prefix({ subjCode: str(subjCode), quarter: str(quarter), program }) }
  }
  const cls = cleanClassName(className)
  if (!cls) return null
  return { numbered: false, name: `${str(subjCode)}_${quarterCode(str(quarter))}_${cls}` }
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
  if (!plan) return ''
  return plan.numbered ? `${plan.name}${nextSequence(existingNames, plan.name)}` : plan.name
}

// ── PIC (người phụ trách khóa) ────────────────────────────────────────────────
// Danh sách PIC của một domain nằm ở tbl_misc: cat = 'PIC', val = tên domain, obj_json = { emails: [...] }.
// obj_json có thể là object (jsonb) hoặc chuỗi JSON; trả về mảng email chữ thường, bỏ trùng, bỏ giá trị không phải email.
export const parsePicEmails = (objJson) => {
  let o = objJson
  if (typeof o === 'string') {
    try { o = JSON.parse(o) } catch { return [] }
  }
  const list = Array.isArray(o?.emails) ? o.emails : []
  const out = []
  for (const e of list) {
    const v = str(e).toLowerCase()
    if (v.includes('@') && !out.includes(v)) out.push(v)
  }
  return out
}

const MAX_LECTURERS = 30
const MAX_NUMBER = 1e9

// Các phần kiểm tra dùng chung cho tạo khóa và sửa khóa (trả về chuỗi lỗi, rỗng nếu hợp lệ)
const checkCoef = (v) => {
  const coef = Number(v)
  return !(coef > 0) || coef > 1000 ? 'Coefficient must be greater than 0.' : ''
}

// PIC không bắt buộc; nếu có thì phải là email (server còn kiểm tra thuộc danh sách PIC của domain)
const checkPic = (v) => {
  const pic = str(v)
  return pic && !pic.includes('@') ? 'Invalid PIC.' : ''
}

const checkLecturers = (list) => {
  const lecturers = list ?? []
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

// Kiểm tra dữ liệu tạo khóa (client và server dùng chung), trả về chuỗi lỗi (rỗng nếu hợp lệ).
// input: { domain, subjCode, prg, program, className, quarter, coef, pic, lecturers: [{ email, name, role, cost_up, cost_qty, noofsection }] }
//   prg     = cột prg của môn học (dùng để tìm đúng dòng môn trong tbl_subject)
//   program = program dùng đặt tên lớp (domain đặt tên theo program); className = lớp nhập tay (domain nhập tay)
// Rate KHÔNG có trong dữ liệu gửi lên: DB tự tra theo loại môn và quý.
export const validateCoursePayload = (p) => {
  if (!str(p.subjCode) || !str(p.prg)) return 'Please select a subject.'
  if (!isQuarter(str(p.quarter))) return 'Please select a quarter.'
  if (isProgramNaming(p.domain)) {
    const program = str(p.program)
    if (!program) return 'Please select the program.'
    const list = knownPrograms(p.domain)
    if (list.length && !list.includes(program)) return 'Invalid program.'
    // Môn đã có program hợp lệ thì khóa phải theo đúng program đó
    if (isValidProgram(p.domain, p.prg) && program !== str(p.prg)) return 'Invalid program.'
  } else if (!cleanClassName(p.className)) {
    return 'Please enter the class.'
  }
  return checkCoef(p.coef) || checkPic(p.pic) || checkLecturers(p.lecturers)
}

// Kiểm tra dữ liệu SỬA khóa: chỉ hệ số, PIC và giảng viên được sửa (tên, môn, quý, Rate không đổi)
export const validateCourseUpdate = (p) => checkCoef(p.coef) || checkPic(p.pic) || checkLecturers(p.lecturers)

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
