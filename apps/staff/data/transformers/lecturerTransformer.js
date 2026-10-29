// Hàm thuần: không đụng Vue / Supabase. Dùng cả ở trình duyệt lẫn server.
import {
  LECTURER_COLUMN_FIELDS, LECTURER_JSON_FIELDS, emptyLecturerProfile
} from '../schemas/lecturerSchema.js' // server (Node) import file này nên phải có đuôi .js

export const normalizeEmail = (v) => String(v || '').trim().toLowerCase()

export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

// Kiểm tra form, trả về chuỗi lỗi (rỗng nếu hợp lệ)
export const validateLecturerForm = (f) => {
  if (!String(f.FullName || '').trim()) return 'Please enter full name.'
  if (!isValidEmail(normalizeEmail(f.Email))) return 'Please enter a valid email.'
  if (f.ContractStart && f.ContractEnd && new Date(f.ContractEnd) < new Date(f.ContractStart)) {
    return 'Contract end must not be before contract start.'
  }
  return ''
}

// Chuỗi rỗng / chỉ có khoảng trắng -> null
const clean = (v) => {
  if (typeof v === 'string') {
    const t = v.trim()
    return t === '' ? null : t
  }
  return v === undefined ? null : v
}

// Form -> thân yêu cầu gửi lên API: { email, fullName, type, highestDegree, contractStart, contractEnd, objJson }
// Trường hay truy vấn thành các khóa riêng (server ghi vào cột), phần còn lại gói trong objJson.
export const toLecturerPayload = (f) => {
  const objJson = {}
  for (const k of LECTURER_JSON_FIELDS) objJson[k] = clean(f[k])
  return {
    email: normalizeEmail(f.Email),
    fullName: String(f.FullName || '').trim(),
    type: clean(f.Type),
    highestDegree: clean(f.HighestDegree),
    contractStart: clean(f.ContractStart),
    contractEnd: clean(f.ContractEnd),
    objJson
  }
}

// Dòng tbl_lecturer (do hàm get_lecturer trả về) -> form. Khóa còn thiếu được bổ sung bằng giá trị rỗng.
// row = { id, email, full_name, type, highest_degree, contract_start, contract_end, obj_json }
export const fromLecturerRow = (row) => {
  const form = emptyLecturerProfile()
  const json = row?.obj_json || {}
  for (const k of LECTURER_JSON_FIELDS) if (json[k] !== undefined && json[k] !== null) form[k] = json[k]
  for (const [field, col] of Object.entries(LECTURER_COLUMN_FIELDS)) {
    if (row?.[col] !== undefined && row?.[col] !== null) form[field] = row[col]
  }
  return form
}

// Danh sách chọn giảng viên (form hồ sơ và form tạo khóa học dùng chung)
// rows = [{ id, email, full_name }] từ hàm list_lecturers
export const toLecturerOptions = (rows = []) =>
  rows
    .map(r => ({ id: r.id, email: r.email, name: r.full_name || r.email }))
    .sort((a, b) => a.name.localeCompare(b.name))

// Lỗi từ API -> câu thông báo cho người dùng
const ERROR_MESSAGES = {
  FORBIDDEN: 'You do not have permission to do this.',
  EMAIL_DUPLICATED: 'A lecturer with this email already exists.',
  KEY_LOCKED: 'The email of an existing lecturer cannot be changed.',
  LECTURER_NOT_FOUND: 'This lecturer no longer exists. Reload the page and try again.',
  INVALID_BODY: 'The data is not valid. Please check the form.',
  INVALID_VALUE: 'One of the values is not valid. Please check the form.',
  DB_ERROR: 'The server could not process the request. Please try again.'
}

export const lecturerErrorMessage = (e) => {
  const text = [e?.data?.statusMessage, e?.statusMessage, e?.message].filter(Boolean).join(' | ')
  const code = Object.keys(ERROR_MESSAGES).find((c) => text.includes(c))
  return code ? ERROR_MESSAGES[code] : 'Something went wrong. Please try again.'
}
