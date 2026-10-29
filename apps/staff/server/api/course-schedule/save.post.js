// Lưu thay đổi lịch của một khóa trong MỘT giao dịch: thêm / sửa / xóa các buổi.
// body: { courseId, upserts: [{ id?, date, start, end, room, lecturerEmail, note }], deletes: [id] }
import { COURSE_SCHEDULE_MENU_KEY, COURSE_SCHEDULE_BUTTONS } from '~/data/schemas/courseScheduleSchema'

export default defineEventHandler(async (event) => {
  const { email, domains } = await requireAdminAccess(event, COURSE_SCHEDULE_MENU_KEY, COURSE_SCHEDULE_BUTTONS.SAVE)

  const body = await readBody(event)
  const courseId = parseCourseId(body?.courseId)
  const course = await loadActiveCourse(event, courseId)
  if (!course) throw createError({ statusCode: 404, statusMessage: 'COURSE_NOT_FOUND' })
  await assertCourseInDomain(event, course, domains)

  const lecturers = await loadActiveLecturers(event)
  const { upserts, deletes } = parseScheduleSave(body, course, lecturers)

  const sessions = await rpcOrThrow(event, 'save_course_schedule', {
    p_course_id: courseId,
    p_upserts: upserts,
    p_deletes: deletes,
    p_user: email,
  })
  return { sessions: sessions ?? [] }
})
