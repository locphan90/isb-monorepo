// Lọc / kiểm tra dữ liệu hồ sơ sinh viên (obj_json) theo schema nhóm-trường. Hàm THUẦN, dùng ở server (và test được độc lập).
// Import schema bằng đường dẫn tương đối + đuôi .js vì server staff không resolve được alias #core/.
import { studentProfileSchema } from '../../../../packages/core/data/schemas/studentProfileSchema.js'

export const STUDENT_GROUPS = studentProfileSchema.groups
export const STUDENT_GROUP_KEYS = STUDENT_GROUPS.map((g) => g.key)

// Khóa gốc của obj_json lưu danh sách môn bắt buộc { [mã môn]: boolean } (ngoài các nhóm của schema, xem System > Required Subjects)
export const REQUIRED_SUBJECTS_KEY = 'RequiredSubjects'

const TEXT_MAX = 500
const MAX_REQUIRED_SUBJECTS = 300
const SUBJECT_CODE_RE = /^[A-Za-z0-9_.-]{1,60}$/
const MAX_CURRENCY = 1e13

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
// Ngày thật theo lịch ('2023-02-30' và '2000-13-45' đều không hợp lệ; không ném lỗi)
const isRealDate = (v) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const d = new Date(`${v}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v
}

// Giữ lại các khóa nhóm hợp lệ (bỏ khóa lạ, bỏ giá trị true/false không phải boolean...)
export const normalizeGroupKeys = (keys) => {
  const set = new Set(Array.isArray(keys) ? keys : [])
  return STUDENT_GROUP_KEYS.filter((k) => set.has(k))
}

// fields từ cấu hình phòng ban { [groupKey]: true } -> danh sách nhóm được phép
export const groupsFromSettings = (fields) =>
  isObject(fields) ? STUDENT_GROUP_KEYS.filter((k) => fields[k] === true) : []

// ── Đọc: chỉ trả về dữ liệu của các nhóm phòng ban được phép xem ─────────────────────────────
// Luôn kèm: objProfile.FullName (tiêu đề tên ở danh sách / chi tiết, như giao diện hiện tại) và RequiredSubjects.
// Mỗi nhóm chỉ trả các trường đã khai trong schema (khóa lạ nằm trong nhóm không bị lộ ra).
export const filterStudentJson = (obj, allowedGroups) => {
  const src = isObject(obj) ? obj : {}
  const allowed = new Set(allowedGroups)
  const out = {}

  const name = isObject(src.objProfile) ? src.objProfile.FullName : undefined
  if (name !== undefined) out.objProfile = { FullName: name }

  for (const g of STUDENT_GROUPS) {
    if (!allowed.has(g.key)) continue
    if (!g.groupJsonPath) {
      for (const f of g.fields) if (src[f.jsonKey] !== undefined) out[f.jsonKey] = src[f.jsonKey]
      continue
    }
    const base = src[g.groupJsonPath]
    if (!isObject(base)) continue
    const target = (out[g.groupJsonPath] = out[g.groupJsonPath] || {})
    for (const f of g.fields) if (base[f.jsonKey] !== undefined) target[f.jsonKey] = base[f.jsonKey]
  }

  if (isObject(src[REQUIRED_SUBJECTS_KEY])) out[REQUIRED_SUBJECTS_KEY] = src[REQUIRED_SUBJECTS_KEY]
  return out
}

// ── Ghi: kiểm tra và chuẩn hóa dữ liệu gửi lên ───────────────────────────────────────────────
const bad = (message) => {
  const e = new Error(message)
  e.invalid = true
  return e
}

// Giá trị một trường theo kiểu khai trong schema; sai kiểu -> ném lỗi (e.invalid = true)
const coerceField = (field, v) => {
  switch (field.type) {
    case 'boolean':
      if (typeof v !== 'boolean') throw bad(`${field.label}: must be true or false.`)
      return v
    case 'currency':
      if (v === null) return null
      if (typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > MAX_CURRENCY) throw bad(`${field.label}: must be a number.`)
      return v
    case 'date':
      if (v === null || v === '') return v
      if (typeof v !== 'string' || !isRealDate(v)) throw bad(`${field.label}: must be a valid date.`)
      return v
    default: // text
      if (v === null) return null
      if (typeof v !== 'string' || v.length > TEXT_MAX) throw bad(`${field.label}: text is too long or not valid.`)
      return v
  }
}

// Dữ liệu gửi lên -> "patch" chỉ gồm trường thuộc các nhóm ĐƯỢC PHÉP sửa (+ RequiredSubjects).
//   - Khóa / nhóm / trường không có trong schema bị bỏ; nhóm không được phép bị bỏ (không báo lỗi để giao diện cũ không vỡ).
//   - Trường vắng mặt trong dữ liệu gửi lên = giữ nguyên (DB trộn patch vào dữ liệu cũ, không ghi đè cả obj_json).
//   - `current` (obj_json hiện có, khi SỬA): trường có giá trị GIỐNG HỆT dữ liệu hiện có bị bỏ khỏi patch và KHÔNG bị kiểm tra kiểu.
//     Lý do: form gửi lại cả những giá trị cũ không đổi; dữ liệu di chuyển từ hệ thống cũ có thể sai kiểu (số tiền dạng chuỗi,
//     ngày không theo ISO...) và không được làm cả lần lưu bị từ chối chỉ vì người dùng không đụng tới chúng.
//   - Trường THAY ĐỔI mà sai kiểu -> ném lỗi (e.invalid = true) kèm câu giải thích.
// Dùng cho cả tạo mới (allowedGroups = tất cả nhóm, current = null: kiểm tra chặt) và sửa (nhóm của phòng ban).
export const sanitizeStudentPatch = (input, allowedGroups, current = null) => {
  if (!isObject(input)) throw bad('Invalid student data.')
  const allowed = new Set(allowedGroups)
  const cur = isObject(current) ? current : null
  const patch = {}

  for (const g of STUDENT_GROUPS) {
    if (!allowed.has(g.key)) continue
    if (!g.groupJsonPath) {
      for (const f of g.fields) {
        const v = input[f.jsonKey]
        if (v === undefined || (cur && cur[f.jsonKey] !== undefined && cur[f.jsonKey] === v)) continue
        patch[f.jsonKey] = coerceField(f, v)
      }
      continue
    }
    const base = input[g.groupJsonPath]
    if (base === undefined || base === null) continue
    if (!isObject(base)) throw bad(`${g.label}: invalid data.`)
    const curBase = cur && isObject(cur[g.groupJsonPath]) ? cur[g.groupJsonPath] : null
    const part = {}
    for (const f of g.fields) {
      const v = base[f.jsonKey]
      if (v === undefined || (curBase && curBase[f.jsonKey] !== undefined && curBase[f.jsonKey] === v)) continue
      part[f.jsonKey] = coerceField(f, v)
    }
    if (Object.keys(part).length) patch[g.groupJsonPath] = part
  }

  const rs = input[REQUIRED_SUBJECTS_KEY]
  if (rs !== undefined && rs !== null) {
    if (!isObject(rs)) throw bad('Required subjects: invalid data.')
    const entries = Object.entries(rs)
    if (entries.length > MAX_REQUIRED_SUBJECTS) throw bad('Required subjects: too many entries.')
    const curRs = cur && isObject(cur[REQUIRED_SUBJECTS_KEY]) ? cur[REQUIRED_SUBJECTS_KEY] : {}
    const part = {}
    for (const [code, v] of entries) {
      if (!SUBJECT_CODE_RE.test(code) || typeof v !== 'boolean') throw bad('Required subjects: invalid data.')
      if (curRs[code] === v) continue
      part[code] = v
    }
    if (Object.keys(part).length) patch[REQUIRED_SUBJECTS_KEY] = part
  }

  return patch
}

// Cấu hình hiển thị của phòng ban gửi lên -> { [groupKey]: boolean } chỉ gồm nhóm hợp lệ
export const sanitizeProfileSettings = (fields) => {
  if (!isObject(fields)) throw bad('Invalid settings.')
  const out = {}
  for (const k of STUDENT_GROUP_KEYS) out[k] = fields[k] === true
  return out
}

// Mã MSSV hợp lệ (khớp ràng buộc trong hàm SQL create_student)
export const isValidMssv = (v) => /^[A-Za-z0-9._-]{1,40}$/.test(String(v ?? '').trim())
