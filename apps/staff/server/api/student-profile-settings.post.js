// Lưu cấu hình nhóm dữ liệu của một phòng ban. body: { menuKey, fields: { [groupKey]: boolean } }
// Chỉ người có quyền trang Student Data Display (System) mới đổi được; người thao tác lấy từ session.
import { sanitizeProfileSettings } from '~/data/transformers/studentJson'

export default defineEventHandler(async (event) => {
  const { email } = await requireAdminAccess(event, STUDENT_SETTINGS_MENU_KEY)
  const body = (await readBody(event)) || {}
  const menuKey = assertStudentListMenu(body.menuKey)
  const fields = sanitizeOrThrow(() => sanitizeProfileSettings(body.fields))

  await rpcOrThrow(event, 'save_student_profile_settings', { p_menu_key: menuKey, p_fields: fields, p_user: email })
  return { ok: true }
})
