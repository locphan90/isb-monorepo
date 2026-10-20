// Transformer: hàm thuần, không import Vue/Nuxt/Supabase
import { STUDENT_EDITABLE_FIELDS } from '../schemas/studentSelfProfile'

const norm = (v) => (v ?? '').toString().trim()

// Profile (từ DB) -> object cho form
export const toForm = (profile = {}) =>
  Object.fromEntries(STUDENT_EDITABLE_FIELDS.map((f) => [f.key, profile?.[f.key] ?? '']))

// Chỉ lấy những trường khác với giá trị đã được duyệt
export const diffProfile = (base = {}, form = {}) => {
  const changes = {}
  for (const f of STUDENT_EDITABLE_FIELDS) {
    if (norm(form[f.key]) !== norm(base?.[f.key])) changes[f.key] = norm(form[f.key])
  }
  return changes
}

// Trả về { [key]: 'message' }, rỗng nghĩa là hợp lệ
export const validateForm = (form = {}) => {
  const errors = {}
  for (const f of STUDENT_EDITABLE_FIELDS) {
    const v = norm(form[f.key])
    if (f.required && !v) errors[f.key] = 'This field is required'
    else if (v && f.maxLength && v.length > f.maxLength) errors[f.key] = `Maximum ${f.maxLength} characters`
    else if (v && f.pattern && !f.pattern.test(v)) errors[f.key] = f.patternMessage ?? 'Invalid value'
  }
  return errors
}

export const fieldLabel = (key) => STUDENT_EDITABLE_FIELDS.find((f) => f.key === key)?.label ?? key

// Dùng cho bảng so sánh giá trị cũ / mới ở màn hình duyệt
export const toDiffRows = (base = {}, changes = {}) =>
  Object.keys(changes ?? {}).map((key) => ({
    key,
    label: fieldLabel(key),
    before: base?.[key] ?? '',
    after: changes[key],
  }))

// FullName trong obj_json có thể là chuỗi hoặc object (các phần tên): gộp thành 1 chuỗi để hiển thị
export const displayName = (v) => {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object') {
    return Object.values(v).filter((x) => typeof x === 'string' && x.trim()).join(' ')
  }
  return ''
}

// Đổi mã lỗi từ API sang câu thông báo cho người dùng (không lộ thông báo kỹ thuật)
const ERROR_MESSAGES = {
  EMAIL_NOT_REGISTERED: 'This email is not registered. Please contact the Registrar.',
  EMAIL_DUPLICATED: 'More than one student record uses this email. Please contact the Registrar.',
  NO_CHANGES: 'There are no changes to send.',
  INVALID_BODY: 'The request is not valid.',
  FORBIDDEN: 'You do not have permission to do this.',
  REQUEST_NOT_FOUND: 'This request no longer exists.',
  REQUEST_NOT_PENDING: 'This request has already been processed.',
  NOTE_REQUIRED: 'Enter a reason before rejecting.',
  STUDENT_NOT_FOUND: 'The student record could not be found.',
  SERVER_CONFIG_ERROR: 'The server is not configured correctly. Please contact the administrator.',
}

export const isUnauthorized = (error) => (error?.statusCode ?? error?.status) === 401

export const translateError = (error) => {
  if (isUnauthorized(error)) return 'Your session has expired. Sign in again.'
  const text = [error?.data?.statusMessage, error?.statusMessage, error?.data?.message, error?.message]
    .filter(Boolean)
    .join(' | ')
  const code = Object.keys(ERROR_MESSAGES).find((c) => text.includes(c))
  return code ? ERROR_MESSAGES[code] : 'Something went wrong. Try again.'
}
