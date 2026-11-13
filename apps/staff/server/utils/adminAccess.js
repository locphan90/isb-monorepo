// Mở rộng của authGuards.js (file riêng để không phải sửa authGuards).
import { requireAdminAccess } from './authGuards'

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
