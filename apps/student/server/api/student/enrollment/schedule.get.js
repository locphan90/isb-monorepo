// Toàn bộ lịch của MỘT khóa sinh viên đang đăng ký: ?courseId=<id>. Khóa không đăng ký -> 403 NOT_ENROLLED.
export default defineEventHandler(async (event) => {
  const user = await requireStudentSession(event)
  const courseId = parseCourseId(getQuery(event).courseId)
  return await rpcOrThrow(event, 'get_student_course_schedule', { p_email: user.email, p_course_id: courseId })
})
