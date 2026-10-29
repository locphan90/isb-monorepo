// Các khóa còn hiệu lực khớp RequiredSubjects của chính sinh viên (kèm các khóa đã đăng ký) và trạng thái đăng ký.
// => { today, requiredCount, courses: [{ id, courseName, subject, startDate, endDate, status, enrolled, sessionCount }] }
export default defineEventHandler(async (event) => {
  const user = await requireStudentSession(event)
  return await rpcOrThrow(event, 'get_student_enrollment', { p_email: user.email })
})
