// Hồ sơ đầy đủ của một giảng viên (có CCCD, mã số thuế, ngân hàng...) -> cần quyền menu Lecturer Profile.
import { LECTURER_MENU_KEY } from '~/data/schemas/lecturerSchema'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, LECTURER_MENU_KEY)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id <= 0) throw createError({ statusCode: 400, statusMessage: 'INVALID_BODY' })

  const row = await rpcOrThrow(event, 'get_lecturer', { p_id: id })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'LECTURER_NOT_FOUND' })
  return row
})
