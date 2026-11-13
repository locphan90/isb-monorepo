// Sửa sinh viên. body: { menuKey, id, objJson }. Cần quyền menu và nút "Edit Student" của phòng ban.
// Chỉ ghi được các nhóm trường phòng ban được cấu hình; trường không gửi lên giữ nguyên (DB trộn, không ghi đè cả obj_json).
// Trường giống hệt dữ liệu hiện có không bị kiểm tra lại (dữ liệu cũ sai kiểu không chặn việc lưu các trường khác).
import { sanitizeStudentPatch } from '~/data/transformers/studentJson'

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) || {}
  const { groups } = await requireStudentAccess(event, body.menuKey, STUDENT_EDIT_BUTTON)

  const id = parseSubjectId(body.id)
  const current = await rpcOrThrow(event, 'get_student_by_id', { p_id: id })
  if (!current) throw createError({ statusCode: 404, statusMessage: 'STUDENT_NOT_FOUND' })

  const patch = sanitizeOrThrow(() => sanitizeStudentPatch(body.objJson, groups, current.obj_json))
  await rpcOrThrow(event, 'update_student', { p_id: id, p_patch: patch })
  return { ok: true }
})
