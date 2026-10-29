// Lịch của sinh viên trong một khoảng ngày: ?from=YYYY-MM-DD&days=7 (mặc định từ hôm nay, 7 ngày).
// => { from, to, sessions: [{ courseId, courseName, subject, date, start, end, room, lecturerName, note }] }
export default defineEventHandler(async (event) => {
  const user = await requireStudentSession(event)
  const { from, to } = parseScheduleRange(getQuery(event))
  const sessions = await rpcOrThrow(event, 'get_student_schedule', { p_email: user.email, p_from: from, p_to: to })
  return { from, to, sessions: sessions ?? [] }
})
