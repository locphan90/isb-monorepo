// Danh sách "môn cần phải học" của MỌI domain: [{ code, name, prg, major, domain }].
// Quyền: nhân viên còn hoạt động (form Add/Edit và chi tiết sinh viên đều cần đọc để vẽ danh sách môn, ở nhiều menu khác nhau).
// Chỉ ĐỌC; ghi qua POST /api/required-subjects (cần quyền menu Required Subjects).
export default defineEventHandler(async (event) => {
  await requireStaffSession(event)
  const { subjects } = await loadRequiredSubjectsRow(event)
  return { subjects }
})
