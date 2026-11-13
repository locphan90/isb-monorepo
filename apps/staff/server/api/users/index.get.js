// Danh sách user (kèm quyền) cho trang User Manager. Chỉ người có quyền menu User Manager.
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'user-manager')
  const users = await rpcOrThrow(event, 'admin_list_users')
  return { users: users ?? [] }
})
