// Danh sách môn học của domain cho Create Course và Course Schedule (thay cho việc trình duyệt đọc tbl_subject bằng anon key).
// ?domain=MBA  =>  { domain, subjects: [{ subj_code, prg, obj_json }] }
// Quyền: menu Create Course HOẶC Course Schedule. Domain do server xác nhận theo user.
// Không trả arr_json (học phí): form khóa học không cần.
import { COURSE_MENU_KEY } from '~/data/schemas/courseSchema'
import { COURSE_SCHEDULE_MENU_KEY } from '~/data/schemas/courseScheduleSchema'

export default defineEventHandler(async (event) => {
  const { email } = await requireAnyAdminAccess(event, [COURSE_MENU_KEY, COURSE_SCHEDULE_MENU_KEY])
  const domain = await resolveSubjectDomain(event, email, getQuery(event).domain)

  const { data, error } = await useSupabaseAdmin(event)
    .from('tbl_subject')
    .select('subj_code, prg, obj_json')
    .eq('domain', domain)
    .or('i_status.is.null,i_status.eq.0') // bỏ môn đã xóa mềm
    .order('subj_code')
    .order('prg')
    .limit(2000)

  if (error) {
    console.error('[course] subjects query failed:', error.message)
    throw createError({ statusCode: 500, statusMessage: 'DB_ERROR' })
  }
  return { domain, subjects: data || [] }
})
