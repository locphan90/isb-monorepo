// Tiện ích cho API hồ sơ sinh viên: quyền truy cập theo menu của phòng ban + nhóm dữ liệu phòng ban được phép thấy / sửa.
import { menuItems } from '~/config/menu'
import { STUDENT_GROUP_KEYS, groupsFromSettings } from '~/data/transformers/studentJson'
import { throwInvalid } from './subjectAdmin'

// Các menu có trang danh sách sinh viên (menu.js đánh dấu `studentList: true`, kể cả menu con nhiều cấp)
const collectListMenus = (items) =>
  items.flatMap((i) => [...(i.studentList ? [i.key] : []), ...collectListMenus(i.children ?? [])])
const LIST_MENU_KEYS = new Set(collectListMenus(menuItems))

export const STUDENT_EDIT_BUTTON = 'edit_student'            // nút trong studentActions: sửa / xóa sinh viên
export const STUDENT_ADD_MENU_KEY = 'registrar-student-add'
export const STUDENT_SETTINGS_MENU_KEY = 'system-student-display'

export const assertStudentListMenu = (menuKey) => {
  const key = String(menuKey ?? '')
  if (!LIST_MENU_KEYS.has(key)) throwInvalid('Invalid menu.')
  return key
}

// Cấu hình { [groupKey]: boolean } của một menu (phòng ban), đủ mọi nhóm
export const loadDeptSettings = async (event, menuKey) => {
  const fields = await rpcOrThrow(event, 'get_student_profile_settings', { p_menu_key: menuKey })
  const out = {}
  for (const k of STUDENT_GROUP_KEYS) out[k] = fields?.[k] === true
  return out
}

// Kiểm tra quyền menu (và nút nếu có) của người đang đăng nhập cho một trang danh sách sinh viên.
// Trả về { email, isSuper, groups }: groups = các nhóm dữ liệu được thấy / sửa (SYS / SYSADMIN: tất cả).
export const requireStudentAccess = async (event, menuKey, buttonKey = null) => {
  const key = assertStudentListMenu(menuKey)
  const { email, isSuper } = await requireAdminAccess(event, key, buttonKey)
  const groups = isSuper ? STUDENT_GROUP_KEYS : groupsFromSettings(await loadDeptSettings(event, key))
  return { email, isSuper, groups }
}

// Chạy hàm kiểm tra dữ liệu thuần; lỗi do dữ liệu sai (e.invalid) -> 400 kèm câu giải thích, lỗi khác ném tiếp
export const sanitizeOrThrow = (fn) => {
  try {
    return fn()
  } catch (e) {
    if (e?.invalid) throwInvalid(e.message)
    throw e
  }
}

export const clampInt = (v, min, max, fallback) => {
  const n = Number.parseInt(v, 10)
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback
}
