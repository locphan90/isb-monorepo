// Hàm thuần: không đụng Vue / Supabase
import { LECTURER_CAT, LECTURER_STATUS, emptyLecturerProfile } from '../schemas/lecturerSchema'

export const normalizeEmail = (v) => String(v || '').trim().toLowerCase()

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

// Kiểm tra form, trả về chuỗi lỗi (rỗng nếu hợp lệ)
export const validateLecturerForm = (f) => {
  if (!String(f.FullName || '').trim()) return 'Please enter full name.'
  if (!isEmail(normalizeEmail(f.Email))) return 'Please enter a valid email.'
  if (f.ContractStart && f.ContractEnd && new Date(f.ContractEnd) < new Date(f.ContractStart)) {
    return 'Contract end must not be before contract start.'
  }
  return ''
}

// Làm sạch form trước khi lưu vào obj_json (chuỗi rỗng -> null)
export const toLecturerJson = (f) => {
  const out = { ...f }
  for (const k of Object.keys(out)) {
    if (typeof out[k] === 'string') out[k] = out[k].trim()
    if (out[k] === '') out[k] = null
  }
  out.FullName = String(f.FullName).trim()
  out.Email = normalizeEmail(f.Email)
  return out
}

// Form -> dòng tbl_misc để insert
export const toLecturerRow = (f, userEmail) => ({
  cat: LECTURER_CAT,
  val: normalizeEmail(f.Email),
  obj_json: toLecturerJson(f),
  i_status: LECTURER_STATUS.ACTIVE,
  last_user: userEmail
})

// Dòng tbl_misc -> form (bổ sung khóa còn thiếu bằng giá trị rỗng)
export const fromLecturerRow = (row) => ({ ...emptyLecturerProfile(), ...(row?.obj_json || {}) })

// Danh sách chọn giảng viên (form hồ sơ và form tạo khóa học dùng chung)
export const toLecturerOptions = (rows = []) =>
  rows
    .map(r => ({ id: r.id, email: r.val, name: r.obj_json?.FullName || r.val }))
    .sort((a, b) => a.name.localeCompare(b.name))