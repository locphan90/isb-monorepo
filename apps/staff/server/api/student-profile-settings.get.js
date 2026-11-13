// Cấu hình nhóm dữ liệu phòng ban được xem: ?menuKey=  =>  { fields: { [groupKey]: boolean } }
// Người xem trang của chính phòng ban đó (để ẩn / hiện nhóm trên giao diện) hoặc người có quyền trang Student Data Display đều đọc được.
export default defineEventHandler(async (event) => {
  const menuKey = assertStudentListMenu(getQuery(event).menuKey)

  try {
    await requireAdminAccess(event, menuKey)
  } catch (e) {
    if (e?.statusCode !== 403) throw e
    await requireAdminAccess(event, STUDENT_SETTINGS_MENU_KEY)
  }
  return { fields: await loadDeptSettings(event, menuKey) }
})
