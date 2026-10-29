// Đăng ký một khóa. body: { courseId }. Hàm SQL kiểm tra khóa còn hiệu lực, khớp môn bắt buộc và chưa đăng ký.
export default defineEventHandler(async (event) => {
  const user = await requireStudentSession(event)
  const body = await readBody(event)
  const courseId = parseCourseId(body?.courseId)

  await rpcOrThrow(event, 'enroll_student_course', {
    p_email: user.email,
    p_course_id: courseId,
    p_user: user.email,
  })
  return { enrolled: true }
})
