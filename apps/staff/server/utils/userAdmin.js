// Kiểm tra dữ liệu cho API quản lý user / phân quyền (không tin dữ liệu từ trình duyệt)
import { availableRanks } from '~/config/rights'
import { throwInvalid } from './subjectAdmin'

const KEY_RE = /^[A-Za-z0-9_-]{1,60}$/
const DOMAIN_RE = /^[A-Za-z0-9_, -]*$/
// Rank chọn được trên giao diện + 'SYS' (chỉ DB / super admin có) + rỗng (chưa gán)
const ALLOWED_RANKS = [...availableRanks, 'SYS', '']
const MAX_MENUS = 300
const MAX_BUTTONS_PER_MENU = 200

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

// { Name, Rank, Domain } đã chuẩn hóa
export const parseUserRole = (role) => {
  if (!isObject(role)) throwInvalid('Invalid role.')
  const Name = String(role.Name ?? '').trim()
  const Rank = String(role.Rank ?? '').trim()
  const Domain = String(role.Domain ?? '').trim()
  if (Name.length > 100) throwInvalid('Name is too long.')
  if (!ALLOWED_RANKS.includes(Rank)) throwInvalid('Invalid rank.')
  if (Domain.length > 100 || !DOMAIN_RE.test(Domain)) throwInvalid('Invalid domain.')
  return { Name, Rank, Domain }
}

// { [menuKey]: { menu: boolean, buttons: { [btnKey]: boolean } } } đã chuẩn hóa
export const parsePermissions = (perms) => {
  if (perms === undefined || perms === null) return {}
  if (!isObject(perms)) throwInvalid('Invalid permissions.')
  const entries = Object.entries(perms)
  if (entries.length > MAX_MENUS) throwInvalid('Too many menus.')
  const out = {}
  for (const [menuKey, entry] of entries) {
    if (!KEY_RE.test(menuKey) || !isObject(entry)) throwInvalid('Invalid permissions.')
    const buttons = {}
    const btnEntries = Object.entries(entry.buttons ?? {})
    if (!isObject(entry.buttons ?? {}) || btnEntries.length > MAX_BUTTONS_PER_MENU) throwInvalid('Invalid permissions.')
    for (const [btnKey, v] of btnEntries) {
      if (!KEY_RE.test(btnKey)) throwInvalid('Invalid permissions.')
      buttons[btnKey] = v === true
    }
    out[menuKey] = { menu: entry.menu === true, buttons }
  }
  return out
}

export const parseEmail = (email) => {
  const e = String(email ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 200) throwInvalid('Please enter a valid email.')
  return e
}
