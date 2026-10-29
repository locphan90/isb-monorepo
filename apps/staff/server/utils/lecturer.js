// Kiểm tra lại dữ liệu hồ sơ giảng viên do client gửi lên (không tin client).
// Chỉ nhận đúng các khóa đã khai trong schema; khóa lạ trong objJson bị bỏ.
import {
  DEGREES, PIT_RATES, LECTURER_TYPES, LECTURER_JSON_FIELDS, LECTURER_DATE_FIELDS, LECTURER_TEXT_MAX
} from '~/data/schemas/lecturerSchema'
import { normalizeEmail, isValidEmail } from '~/data/transformers/lecturerTransformer'

const bad = (code) => createError({ statusCode: 400, statusMessage: code })

const isDateOnly = (v) => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const d = new Date(`${v}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v
}

// null / '' -> null; ngày không hợp lệ -> INVALID_VALUE
const optDate = (v) => {
  if (v === null || v === undefined || v === '') return null
  if (!isDateOnly(v)) throw bad('INVALID_VALUE')
  return v
}

// null / '' -> null; không phải chuỗi hoặc quá dài -> INVALID_VALUE
const optText = (v) => {
  if (v === null || v === undefined) return null
  if (typeof v !== 'string') throw bad('INVALID_VALUE')
  const t = v.trim()
  if (t === '') return null
  if (t.length > LECTURER_TEXT_MAX) throw bad('INVALID_VALUE')
  return t
}

const optChoice = (v, list) => {
  const t = optText(v)
  if (t !== null && !list.includes(t)) throw bad('INVALID_VALUE')
  return t
}

// body: { id?, email, fullName, type, highestDegree, contractStart, contractEnd, objJson }
// -> { id|null, email, fullName, type, highestDegree, contractStart, contractEnd, objJson }
export const parseLecturerBody = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw bad('INVALID_BODY')

  let id = null
  if (body.id !== undefined && body.id !== null) {
    id = Number(body.id)
    if (!Number.isSafeInteger(id) || id <= 0) throw bad('INVALID_BODY')
  }

  const email = normalizeEmail(body.email)
  if (!isValidEmail(email) || email.length > 254) throw bad('INVALID_VALUE')

  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
  if (!fullName || fullName.length > LECTURER_TEXT_MAX) throw bad('INVALID_VALUE')

  const contractStart = optDate(body.contractStart)
  const contractEnd = optDate(body.contractEnd)
  if (contractStart && contractEnd && contractEnd < contractStart) throw bad('INVALID_VALUE')

  const src = body.objJson
  if (src !== undefined && src !== null && (typeof src !== 'object' || Array.isArray(src))) throw bad('INVALID_BODY')

  const objJson = {}
  for (const k of LECTURER_JSON_FIELDS) {
    const v = src?.[k]
    if (LECTURER_DATE_FIELDS.includes(k)) {
      objJson[k] = optDate(v)
    } else if (k === 'PITRate') {
      if (v === null || v === undefined || v === '') objJson[k] = null
      else if (PIT_RATES.includes(Number(v))) objJson[k] = Number(v)
      else throw bad('INVALID_VALUE')
    } else {
      objJson[k] = optText(v)
    }
  }

  return {
    id,
    email,
    fullName,
    type: optChoice(body.type, LECTURER_TYPES),
    highestDegree: optChoice(body.highestDegree, DEGREES),
    contractStart,
    contractEnd,
    objJson
  }
}
