// Lịch của một khóa: ?courseId=<tbl_course.id>. Kèm danh sách giảng viên và phòng đã dùng để chọn nhanh.
import { COURSE_SCHEDULE_MENU_KEY } from '~/data/schemas/courseScheduleSchema'

export default defineEventHandler(async (event) => {
  const { domains } = await requireAdminAccess(event, COURSE_SCHEDULE_MENU_KEY)

  const courseId = parseCourseId(getQuery(event).courseId)
  const course = await loadActiveCourse(event, courseId)
  if (!course) throw createError({ statusCode: 404, statusMessage: 'COURSE_NOT_FOUND' })
  await assertCourseInDomain(event, course, domains)

  const [sessions, rooms, lecturers] = await Promise.all([
    rpcOrThrow(event, 'get_course_schedule', { p_course_id: courseId }),
    rpcOrThrow(event, 'get_schedule_rooms'),
    loadActiveLecturers(event),
  ])

  return {
    course,
    sessions: sessions ?? [],
    rooms: rooms ?? [],
    lecturers: [...lecturers].map(([email, name]) => ({ email, name })).sort((a, b) => a.name.localeCompare(b.name)),
  }
})
