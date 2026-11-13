// Khóa (retire) user. body: { id }. Cùng quy tắc phân cấp như update (DB kiểm tra).
export default defineEventHandler(async (event) => {
  const { email: actor, isSuper } = await requireAdminAccess(event, 'user-manager')
  const body = (await readBody(event)) || {}
  await rpcOrThrow(event, 'admin_retire_user', { p_id: parseSubjectId(body.id), p_actor: actor, p_actor_super: isSuper })
  return { ok: true }
})
