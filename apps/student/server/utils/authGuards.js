// server/utils/authGuards.js (app sinh viên)
// Mọi danh tính lấy từ session (cookie đã ký), không nhận từ client.

// Chỉ phiên sinh viên (role = 'student')
export const requireStudentSession = async (event) => {
  const { user } = await requireUserSession(event)
  if (user?.role !== 'student' || !user?.email) {
    throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })
  }
  return user
}
