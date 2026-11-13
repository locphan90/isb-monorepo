// Mở rộng của authGuards.js (file riêng để không phải sửa authGuards).
import { requireAdminAccess, escapeLike } from './authGuards'

// Như requireAdminAccess nhưng chấp nhận quyền của BẤT KỲ menu nào trong danh sách (vd danh sách môn dùng chung
// cho Create Course và Course Schedule). Chỉ bỏ qua lỗi 403; lỗi khác (DB, chưa đăng nhập) ném lại nguyên vẹn.
export const requireAnyAdminAccess = async (event, menuKeys) => {
  let last = null
  for (const key of menuKeys) {
    try {
      return await requireAdminAccess(event, key)
    } catch (e) {
      if (e?.statusCode !== 403) throw e
      last = e
    }
  }
  throw last || createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })
}

// Các domain của user (tbl_misc USERS.obj_json.Domain, nhiều domain cách nhau bởi dấu phẩy), lấy ở SERVER theo email trong session.
export const loadUserDomains = async (event, email) => {
  const { data, error } = await useSupabaseAdmin(event)
    .from('tbl_misc')
    .select('user_role:obj_json')
    .eq('cat', 'USERS')
    .or('i_status.is.null,i_status.eq.0')
    .ilike('val', escapeLike(email))
    .maybeSingle()
  if (error) {
    console.error('[Guard] domains query failed:', error.message)
    throw createError({ statusCode: 500, statusMessage: 'DB_ERROR' })
  }
  return String(data?.user_role?.Domain || '').split(',').map((d) => d.trim()).filter(Boolean)
}

// Domain của user từ kết quả requireAdminAccess. Dùng `access.domains` nếu guard có trả (bản authGuards mới),
// nếu không thì tự tra: tránh trường hợp domains = undefined làm API lịch học lọc ra 0 khóa / từ chối mọi khóa.
export const accessDomains = async (event, access) =>
  Array.isArray(access?.domains) ? access.domains : await loadUserDomains(event, access.email)
