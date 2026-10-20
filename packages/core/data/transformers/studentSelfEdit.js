// Transformer: hàm thuần, không import Vue/Nuxt/Supabase
import { studentProfileSchema } from '../schemas/studentProfileSchema.js'
import {
  FIELD_ACCESS, SELECT_OPTIONS, TEXTAREA_KEYS, FULL_NAME_KEY, REQUIRED_KEYS, STUDENT_VIEW_GROUP_PATHS,
} from '../schemas/studentSelfEdit.js'

// Nhãn + kiểu lấy từ nhóm objProfile của schema có sẵn; key chưa khai báo thì suy từ dữ liệu
const objProfileFields = studentProfileSchema.groups.find((g) => g.key === 'objProfile')?.fields ?? []
const schemaByKey = new Map(objProfileFields.map((f) => [f.jsonKey, f]))
const schemaOrder = new Map(objProfileFields.map((f, i) => [f.jsonKey, i]))

// FullName nay thuộc nhóm objProfile (đã có trong schemaByKey); nếu schema chưa được chuyển thì lùi về nhóm 'basic'.
// Luôn xếp FullName lên đầu danh sách.
if (!schemaByKey.has(FULL_NAME_KEY)) {
  const legacyField = studentProfileSchema.groups
    .find((g) => g.key === 'basic')?.fields.find((f) => f.jsonKey === FULL_NAME_KEY)
  if (legacyField) schemaByKey.set(FULL_NAME_KEY, legacyField)
}
schemaOrder.set(FULL_NAME_KEY, -1)

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const NUMBER = /^-?\d+(\.\d+)?$/
const MAX_LENGTH = 500
const norm = (v) => (v ?? '').toString().trim()

// 'RegAddress' -> 'Reg Address', 'MOET_EntryDate' -> 'MOET Entry Date'
export const humanizeKey = (key) => key.replace(/_/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2')
export const fieldLabel = (key) => schemaByKey.get(key)?.label ?? humanizeKey(key)

// Trường khai báo trong schema đi trước (đúng thứ tự schema), còn lại xếp theo bảng chữ cái
export const sortKeys = (keys = []) =>
  [...keys].sort((a, b) => (schemaOrder.get(a) ?? 1e6) - (schemaOrder.get(b) ?? 1e6) || a.localeCompare(b))

// Kiểu nhập/hiển thị: 'text' | 'date' | 'number' | 'currency'
export const resolveFieldType = (key, value, dateKeys = []) => {
  const t = schemaByKey.get(key)?.type
  if (t === 'date' || dateKeys.includes(key)) return 'date'
  if (t === 'currency') return 'currency'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'string' && ISO_DATE.test(value)) return 'date'
  return 'text'
}

export const formatValue = (value, type) => {
  if (value === null || value === undefined || value === '') return ''
  if (type === 'currency') return Number(value).toLocaleString('vi-VN') + ' VND'
  return String(value)
}

// FullName có thể là chuỗi hoặc object (các phần tên): gộp thành 1 chuỗi để hiển thị
export const displayName = (v) => {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object') {
    return Object.values(v).filter((x) => typeof x === 'string' && x.trim()).join(' ')
  }
  return ''
}

/* ───────────── Trang Setting (admin) ───────────── */

// Tất cả key: trường khai báo trong schema + key thực tế trong dữ liệu + key đã lưu trong cấu hình
export const buildSettingKeys = (dataKeys = [], setting = {}) =>
  sortKeys([
    ...new Set([
      FULL_NAME_KEY,
      ...objProfileFields.map((f) => f.jsonKey),
      ...dataKeys,
      ...(setting.view ?? []),
      ...(setting.edit ?? []),
    ]),
  ])

export const getKeyLocks = (key, setting = {}) => ({
  noView: (setting.neverView ?? []).includes(key),
  noEdit: (setting.neverEdit ?? []).includes(key),
})

// Cấu hình đã lưu -> { [key]: 'hidden' | 'view' | 'edit' }; trường bị khóa cứng được hạ về mức cho phép
export const toAccessMap = (keys = [], setting = {}) => {
  const map = {}
  for (const key of keys) {
    const { noView, noEdit } = getKeyLocks(key, setting)
    if ((setting.edit ?? []).includes(key) && !noEdit) map[key] = FIELD_ACCESS.EDIT
    else if (((setting.view ?? []).includes(key) || (setting.edit ?? []).includes(key)) && !noView) map[key] = FIELD_ACCESS.VIEW
    else map[key] = FIELD_ACCESS.HIDDEN
  }
  return map
}

// { [key]: access } -> payload lưu: view = chỉ xem, edit = được sửa
export const fromAccessMap = (map = {}) => {
  const entries = Object.entries(map)
  return {
    view: entries.filter(([, a]) => a === FIELD_ACCESS.VIEW).map(([k]) => k),
    edit: entries.filter(([, a]) => a === FIELD_ACCESS.EDIT).map(([k]) => k),
  }
}

/* ───────────── Trang sinh viên ───────────── */

// student = kết quả get_student_self: { profile, viewKeys, editKeys, dateKeys, ... }
export const buildStudentFields = (student) => {
  const profile = student?.profile ?? {}
  const dateKeys = student?.dateKeys ?? []
  const toField = (key) => ({
    key,
    label: fieldLabel(key),
    type: resolveFieldType(key, profile[key], dateKeys),
    textarea: TEXTAREA_KEYS.includes(key),
    options: SELECT_OPTIONS[key] ?? null,
  })
  return {
    // Tên đã hiện ở đầu trang nên không lặp lại trong phần thông tin chỉ xem
    readOnly: sortKeys(student?.viewKeys).filter((k) => k !== FULL_NAME_KEY).map(toField),
    editable: sortKeys(student?.editKeys).map(toField),
  }
}

// Danh sách lựa chọn của ô select: thêm giá trị hiện có nếu không nằm trong danh sách chuẩn
export const selectItems = (field, currentValue) => {
  const items = [...(field.options ?? [])]
  const cur = norm(currentValue)
  if (cur && !items.includes(cur)) items.unshift(cur)
  return items
}

export const toEditForm = (profile = {}, editKeys = []) =>
  Object.fromEntries(editKeys.map((k) => [k, profile?.[k] == null ? '' : String(profile[k])]))

// Chỉ lấy những trường thực sự đổi so với giá trị hiện tại
export const diffEdit = (profile = {}, form = {}, editKeys = []) => {
  const changes = {}
  for (const key of editKeys) {
    if (norm(form[key]) !== norm(profile?.[key])) changes[key] = norm(form[key])
  }
  return changes
}

// Trả về { [key]: 'message' }, rỗng nghĩa là hợp lệ (server/DB kiểm tra lại)
export const validateEdit = (form = {}, editableFields = []) => {
  const errors = {}
  for (const f of editableFields) {
    const v = norm(form[f.key])
    if (REQUIRED_KEYS.includes(f.key) && !v) errors[f.key] = 'This field is required'
    else if (v.length > MAX_LENGTH) errors[f.key] = `Maximum ${MAX_LENGTH} characters`
    else if (v && f.type === 'date' && !ISO_DATE.test(v)) errors[f.key] = 'Enter a valid date'
    else if (v && (f.type === 'number' || f.type === 'currency') && !NUMBER.test(v)) errors[f.key] = 'Enter a valid number'
  }
  return errors
}

/* ───────────── Nhóm chỉ xem ngoài objProfile (Docs, objEng...) ───────────── */

// Danh mục lấy từ schema (đúng thứ tự schema), chỉ gồm các nhóm được phép:
// [{ path, label, fields: [{ id: 'Docs::NatID', key, label, type }] }]
export const viewGroupCatalog = () =>
  studentProfileSchema.groups
    .filter((g) => STUDENT_VIEW_GROUP_PATHS.includes(g.groupJsonPath))
    .map((g) => ({
      path: g.groupJsonPath,
      label: g.label,
      fields: g.fields.map((f) => ({
        id: `${g.groupJsonPath}::${f.jsonKey}`,
        key: f.jsonKey,
        label: f.label,
        type: f.type,
      })),
    }))

// Cấu hình đã lưu { Docs: ['NatID'] } -> { 'Docs::NatID': 'view' | 'hidden' } cho mọi trường trong danh mục
export const toGroupAccessMap = (groups = {}) => {
  const map = {}
  for (const g of viewGroupCatalog()) {
    for (const f of g.fields) {
      map[f.id] = (groups?.[g.path] ?? []).includes(f.key) ? FIELD_ACCESS.VIEW : FIELD_ACCESS.HIDDEN
    }
  }
  return map
}

// Ngược lại: chỉ giữ các trường 'view' (nhóm không có trường nào thì bỏ)
export const fromGroupAccessMap = (map = {}) => {
  const groups = {}
  for (const g of viewGroupCatalog()) {
    const keys = g.fields.filter((f) => map[f.id] === FIELD_ACCESS.VIEW).map((f) => f.key)
    if (keys.length) groups[g.path] = keys
  }
  return groups
}

export const formatGroupValue = (value, type) => {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'boolean' || type === 'boolean') return value === true || value === 'true' ? 'Yes' : 'No'
  if (type === 'currency') return Number(value).toLocaleString('vi-VN') + ' VND'
  return String(value)
}

// Khối hiển thị cho sinh viên: chỉ trường đã được chọn xem (server đã lọc) và có dữ liệu; nhóm trống thì bỏ
export const buildStudentGroupBlocks = (student) => {
  const data = student?.groups ?? {}
  return viewGroupCatalog()
    .map((g) => ({
      path: g.path,
      label: g.label,
      items: g.fields
        .filter((f) => data[g.path] && Object.prototype.hasOwnProperty.call(data[g.path], f.key))
        .map((f) => ({ key: f.key, label: f.label, value: formatGroupValue(data[g.path][f.key], f.type) })),
    }))
    .filter((b) => b.items.length)
}

/* ───────────── Lỗi từ API ───────────── */

const ERROR_MESSAGES = {
  EMAIL_NOT_REGISTERED: 'This email is not registered. Please contact the Registrar.',
  EMAIL_DUPLICATED: 'More than one student record uses this email. Please contact the Registrar.',
  FIELD_NOT_EDITABLE: 'Some fields can no longer be edited. The page has been refreshed.',
  NO_CHANGES: 'There are no changes to save.',
  INVALID_VALUE: 'One of the values is not valid.',
  INVALID_BODY: 'The request is not valid.',
  KEY_LOCKED: 'Some fields cannot be shared with students.',
  FORBIDDEN: 'You do not have permission to do this.',
  SERVER_CONFIG_ERROR: 'The server is not configured correctly. Please contact the administrator.',
}

export const isUnauthorized = (error) => (error?.statusCode ?? error?.status) === 401

// Mã lỗi nghiệp vụ (statusMessage do server trả về), null nếu không nhận ra
export const errorCodeOf = (error) => {
  const text = [error?.data?.statusMessage, error?.statusMessage, error?.data?.message, error?.message]
    .filter(Boolean)
    .join(' | ')
  return Object.keys(ERROR_MESSAGES).find((c) => text.includes(c)) ?? null
}

export const translateError = (error) => {
  if (isUnauthorized(error)) return 'Your session has expired. Sign in again.'
  const code = errorCodeOf(error)
  return code ? ERROR_MESSAGES[code] : 'Something went wrong. Try again.'
}
