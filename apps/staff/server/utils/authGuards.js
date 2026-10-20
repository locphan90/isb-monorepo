// server/utils/authGuards.js
// Kiểm tra quyền ở SERVER cho các API mới. Mọi danh tính lấy từ session (cookie đã ký), không nhận từ client.

// PHẢI khớp composables/usePermission.js
const SUPER_ADMIN_RANKS = ['SYS', 'SYSADMIN']

// Escape ký tự đại diện của LIKE/ILIKE (_ và %) trước khi so khớp email
export const escapeLike = (s) => s.replace(/[\\%_]/g, '\\$&')

// Chỉ user admin còn hoạt động trong tbl_misc, có quyền menu (và nút nếu truyền buttonKey)
// theo cấu trúc PERMISSIONS: { [menuKey]: { menu: true, buttons: { [btnKey]: true } } }
export const requireAdminAccess = async (event, menuKey, buttonKey = null) => {
  const { user } = await requireUserSession(event)
  const email = user?.email?.trim()
  if (!email || user?.role === 'student') {
    throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })
  }

  const { data, error } = await useSupabaseAdmin(event)
    .from('tbl_misc')
    .select('user_role:obj_json, user_right:arr_json')
    .eq('cat', 'USERS')
    .or('i_status.is.null,i_status.eq.0')
    .ilike('val', escapeLike(email))
    .maybeSingle()

  if (error) {
    console.error('[Guard] tbl_misc query failed:', error.message)
    throw createError({ statusCode: 500, statusMessage: 'DB_ERROR' })
  }
  if (!data) throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })

  if (SUPER_ADMIN_RANKS.includes(data.user_role?.Rank)) return { email }

  const perm = data.user_right?.PERMISSIONS?.[menuKey]
  const allowed = perm?.menu === true && (!buttonKey || perm?.buttons?.[buttonKey] === true)
  if (!allowed) throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })
  return { email }
}
