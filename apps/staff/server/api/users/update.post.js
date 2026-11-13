// Sửa role + quyền của user. body: { id, role: { Name, Rank, Domain }, permissions }
// Email không đổi được. Người không phải SYS / SYSADMIN không sửa được user SYS / SYSADMIN, không gán Rank đó, không sửa chính mình (DB kiểm tra).
export default defineEventHandler(async (event) => {
  const { email: actor, isSuper } = await requireAdminAccess(event, 'user-manager')
  const body = (await readBody(event)) || {}
  await rpcOrThrow(event, 'admin_update_user', {
    p_id: parseSubjectId(body.id),
    p_role: parseUserRole(body.role),
    p_permissions: parsePermissions(body.permissions),
    p_actor: actor,
    p_actor_super: isSuper,
  })
  return { ok: true }
})
