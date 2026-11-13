// Tên các khóa đang dùng bắt đầu bằng một tiền tố, để Create Course xem trước số thứ tự tiếp theo
// (DB mới là nơi chốt số khi tạo khóa). ?prefix=BAP_Q426_T  =>  { names: ['BAP_Q426_T1', ...] }
// Quyền: menu Create Course.
import { COURSE_MENU_KEY } from '~/data/schemas/courseSchema'

const PREFIX_MAX = 100

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, COURSE_MENU_KEY)

  const prefix = String(getQuery(event).prefix ?? '').trim()
  if (!prefix || prefix.length > PREFIX_MAX) throwInvalid('Invalid course name prefix.')

  const { data, error } = await useSupabaseAdmin(event)
    .from('tbl_course')
    .select('course_name')
    .like('course_name', `${escapeLike(prefix)}%`)
    .eq('i_status', 0)
    .limit(1000)

  if (error) {
    console.error('[course] names query failed:', error.message)
    throw createError({ statusCode: 500, statusMessage: 'DB_ERROR' })
  }
  return { names: (data || []).map((r) => r.course_name) }
})
