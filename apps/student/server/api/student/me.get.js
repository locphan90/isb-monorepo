// Hồ sơ của CHÍNH sinh viên đang đăng nhập (email lấy từ session, không nhận từ client)
export default defineEventHandler(async (event) => {
  const user = await requireStudentSession(event)
  const student = await rpcOrThrow(event, 'get_student_self', { p_email: user.email })
  return { student: student ?? null }
})
