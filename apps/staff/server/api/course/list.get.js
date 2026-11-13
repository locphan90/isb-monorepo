// Danh sách khóa của domain cho form Create Course.
// ?domain=MBA&includePast=1  =>  { today, courses: [...] }
// Mặc định chỉ khóa chưa kết thúc (end_date >= hôm nay theo giờ Việt Nam); includePast=1 thêm cả khóa đã kết thúc.
// Quyền: menu Create Course. Domain do server xác nhận theo user; tbl_course không có cột domain nên khóa thuộc domain
// được suy ra từ môn học (tên khóa bắt đầu bằng '<mã môn>_Q', mã môn thuộc tbl_subject của domain).
import { COURSE_MENU_KEY } from '~/data/schemas/courseSchema'

export default defineEventHandler(async (event) => {
  const { email } = await requireAdminAccess(event, COURSE_MENU_KEY)
  const q = getQuery(event)
  const domain = await resolveSubjectDomain(event, email, q.domain)
  const includePast = q.includePast === '1'
  const today = todayVN()

  let query = useSupabaseAdmin(event)
    .from('tbl_course')
    .select(COURSE_LIST_COLUMNS)
    .eq('i_status', 0)
    .order('start_date', { ascending: false })
    .order('id', { ascending: false })
    .limit(1000)
  if (!includePast) query = query.or(`end_date.gte.${today},end_date.is.null`)

  const { data, error } = await query
  if (error) {
    console.error('[course] list query failed:', error.message)
    throw createError({ statusCode: 500, statusMessage: 'DB_ERROR' })
  }

  const subjectCodes = await loadDomainSubjectCodes(event, [domain])
  const courses = (data || [])
    .filter((r) => courseInDomain(r.course_name, subjectCodes))
    .map((r) => toCourseRow(r, today))
  return { today, courses }
})
