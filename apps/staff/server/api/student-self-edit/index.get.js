// Cấu hình "sinh viên được xem/sửa trường nào" + danh sách key có trong objProfile (cho trang Setting)
const MENU_KEY = 'system-student-self-edit' // khớp config/menu.js

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, MENU_KEY)
  const [keys, setting] = await Promise.all([
    rpcOrThrow(event, 'list_student_profile_keys'),
    rpcOrThrow(event, 'get_student_self_edit_setting'),
  ])
  return { keys: keys ?? [], setting }
})
