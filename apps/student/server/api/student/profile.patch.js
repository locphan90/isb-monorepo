// Sinh viên cập nhật TRỰC TIẾP các trường được phép sửa (danh sách do admin cấu hình).
// Email lấy từ session; DB kiểm tra lại từng key có nằm trong danh sách được sửa hay không.
export default defineEventHandler(async (event) => {
  const user = await requireStudentSession(event)
  const body = await readBody(event)
  const changes = body?.changes
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    throw createError({ statusCode: 400, statusMessage: 'INVALID_BODY' })
  }
  const updated = await rpcOrThrow(event, 'update_student_self', {
    p_email: user.email,
    p_changes: changes,
  })
  return { updated: updated ?? [] }
})
