// Danh sách khóa học để xếp lịch. Mặc định chỉ các khóa còn hiệu lực (chưa kết thúc);
// ?includePast=1 để xem cả các khóa đã kết thúc.
import { COURSE_SCHEDULE_MENU_KEY } from '~/data/schemas/courseScheduleSchema'

export default defineEventHandler(async (event) => {
  const { domains } = await requireAdminAccess(event, COURSE_SCHEDULE_MENU_KEY)

  const includePast = getQuery(event).includePast === '1'
  const today = todayVN()

  let query = useSupabaseAdmin(event)
    .from('tbl_course')
    .select('id, course_name, subject, start_date, end_date, obj_lecturer')
    .eq('i_status', 0)
    .order('start_date', { ascending: false })
    .limit(1000)
  if (!includePast) query = query.gte('end_date', today)

  const { data, error } = await query
  if (error) {
    console.error('[course-schedule] courses query failed:', error.message)
    throw createError({ statusCode: 500, statusMessage: 'DB_ERROR' })
  }

  // Chỉ trả các khóa thuộc domain của user đăng nhập
  const subjectCodes = await loadDomainSubjectCodes(event, domains)
  const courses = (data || []).map(toCourseInfo).filter((c) => courseInDomain(c.courseName, subjectCodes))
  const counts = courses.length
    ? await rpcOrThrow(event, 'get_course_schedule_counts', { p_course_ids: courses.map((c) => c.id) })
    : {}

  return {
    today,
    courses: courses.map((c) => ({
      ...c,
      status: c.endDate < today ? 'ended' : c.startDate > today ? 'upcoming' : 'running',
      sessionCount: counts?.[String(c.id)] ?? 0,
    })),
  }
})
