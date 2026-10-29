// Thêm (không có id) hoặc cập nhật (có id) hồ sơ giảng viên. Người thao tác lấy từ session, không nhận từ client.
// body: { id?, email, fullName, type, highestDegree, contractStart, contractEnd, objJson }
import { LECTURER_MENU_KEY } from '~/data/schemas/lecturerSchema'

export default defineEventHandler(async (event) => {
  const { email: user } = await requireAdminAccess(event, LECTURER_MENU_KEY)
  const p = parseLecturerBody(await readBody(event))

  const id = await rpcOrThrow(event, 'save_lecturer', {
    p_id: p.id,
    p_email: p.email,
    p_full_name: p.fullName,
    p_type: p.type,
    p_highest_degree: p.highestDegree,
    p_contract_start: p.contractStart,
    p_contract_end: p.contractEnd,
    p_obj_json: p.objJson,
    p_user: user,
  })
  return { id }
})
