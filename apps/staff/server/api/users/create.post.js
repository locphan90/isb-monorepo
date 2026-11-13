// Tạo user. body: { email, role: { Name, Rank, Domain }, permissions }
// Người tạo (last_user) lấy từ session, không tin trình duyệt. Chỉ SYS / SYSADMIN mới được tạo user có Rank SYS / SYSADMIN (DB kiểm tra).
export default defineEventHandler(async (event) => {
  const { email: actor, isSuper } = await requireAdminAccess(event, 'user-manager')
  const body = (await readBody(event)) || {}
  await rpcOrThrow(event, 'admin_create_user', {
    p_email: parseEmail(body.email),
    p_role: parseUserRole(body.role),
    p_permissions: parsePermissions(body.permissions),
    p_actor: actor,
    p_actor_super: isSuper,
  })
  return { ok: true }
})
