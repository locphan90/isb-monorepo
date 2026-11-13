// Danh sách PIC (người phụ trách khóa) của một domain: tbl_misc, cat = 'PIC', val = tên domain, obj_json = { emails: [...] }.
// Đọc bằng service role ở server; domain phải là domain đã được resolveSubjectDomain xác nhận.
import { parsePicEmails } from '~/data/transformers/courseRules'

export const loadPicEmails = async (event, domain) => {
  const { data, error } = await useSupabaseAdmin(event)
    .from('tbl_misc')
    .select('obj_json')
    .eq('cat', 'PIC')
    .eq('val', domain)
    .or('i_status.is.null,i_status.eq.0') // bỏ dòng đã xóa mềm
    .order('id', { ascending: false })
    .limit(1)

  if (error) {
    console.error('[course] PIC query failed:', error.message)
    throw createError({ statusCode: 500, statusMessage: 'DB_ERROR' })
  }
  return parsePicEmails(data?.[0]?.obj_json)
}
