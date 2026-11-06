// Tiện ích cho API môn học. Domain lấy từ tbl_misc (USERS.obj_json.Domain), không tin domain client gửi lên.
// Một user có thể có nhiều domain (chuỗi cách nhau bởi dấu phẩy) và chuyển qua lại trên giao diện,
// nên client chỉ ĐỀ NGHỊ domain đang chọn; server chỉ nhận nếu nó nằm trong danh sách domain của user.
import { escapeLike } from './authGuards'

export const resolveSubjectDomain = async (event, email, requested) => {
  const { data, error } = await useSupabaseAdmin(event)
    .from('tbl_misc')
    .select('user_role:obj_json')
    .eq('cat', 'USERS')
    .or('i_status.is.null,i_status.eq.0')
    .ilike('val', escapeLike(email))
    .maybeSingle()

  if (error) {
    console.error('[subject] tbl_misc query failed:', error.message)
    throw createError({ statusCode: 500, statusMessage: 'DB_ERROR' })
  }
  const domains = String(data?.user_role?.Domain || '').split(',').map((d) => d.trim()).filter(Boolean)
  if (!domains.length) throw createError({ statusCode: 403, statusMessage: 'DOMAIN_NOT_ALLOWED' })

  const want = String(requested || '').trim()
  if (!want) return domains[0]
  if (!domains.includes(want)) throw createError({ statusCode: 403, statusMessage: 'DOMAIN_NOT_ALLOWED' })
  return want
}

// Lỗi kiểm tra dữ liệu: trả 400 kèm câu cụ thể (chỉ ASCII để hợp lệ trong statusMessage)
export const throwInvalid = (message) => {
  throw createError({ statusCode: 400, statusMessage: `INVALID: ${message}` })
}

export const parseSubjectId = (v) => {
  const n = Number(v)
  if (!Number.isSafeInteger(n) || n <= 0) throw createError({ statusCode: 400, statusMessage: 'INVALID_BODY' })
  return n
}
