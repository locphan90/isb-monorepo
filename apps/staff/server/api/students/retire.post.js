// Xóa mềm sinh viên (i_status = 1). body: { menuKey, id }. Cần quyền menu và nút "Edit Student" (nút Delete nằm trong cửa sổ sửa).
export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) || {}
  await requireStudentAccess(event, body.menuKey, STUDENT_EDIT_BUTTON)
  await rpcOrThrow(event, 'retire_student', { p_id: parseSubjectId(body.id) })
  return { ok: true }
})
