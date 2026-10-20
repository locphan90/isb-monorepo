// Lưu cấu hình. Cần quyền menu + nút 'save' (nút tự xuất hiện trong User Manager nhờ PermBtn).
const MENU_KEY = 'system-student-self-edit' // khớp config/menu.js

export default defineEventHandler(async (event) => {
  const admin = await requireAdminAccess(event, MENU_KEY, 'save')
  const body = await readBody(event)
  if (!Array.isArray(body?.view) || !Array.isArray(body?.edit)) {
    throw createError({ statusCode: 400, statusMessage: 'INVALID_BODY' })
  }
  // groups (tùy chọn): { Docs: ['NatID', ...], objEng: [...] }; không gửi thì giữ nguyên cấu hình nhóm hiện có
  const groups = body.groups ?? null
  if (groups !== null && (typeof groups !== 'object' || Array.isArray(groups))) {
    throw createError({ statusCode: 400, statusMessage: 'INVALID_BODY' })
  }
  await rpcOrThrow(event, 'save_student_self_edit_setting', {
    p_view: body.view,
    p_edit: body.edit,
    p_user: admin.email,
    p_groups: groups,
  })
  return { ok: true }
})
