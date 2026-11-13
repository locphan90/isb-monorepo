// Hồ sơ của CHÍNH người đang đăng nhập: { user_role, user_right } (role, quyền menu/nút, ISB_APP).
// Thay cho việc trình duyệt tự đọc tbl_misc bằng anon key. Chỉ trả dữ liệu của email trong session; user bị khóa -> 403.
export default defineEventHandler(async (event) => {
  const { email } = await requireStaffSession(event)
  const profile = await rpcOrThrow(event, 'get_staff_profile', { p_email: email })
  if (!profile) throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })
  return profile
})
