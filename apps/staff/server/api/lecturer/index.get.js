// Danh sách giảng viên đang hoạt động (phần nhẹ: id, email, full_name, type) cho các ô chọn giảng viên.
// Form Create Course và Lecturer Profile đều dùng nên chỉ cần là nhân viên đang hoạt động; hồ sơ đầy đủ ở [id].get.js.
export default defineEventHandler(async (event) => {
  await requireStaffSession(event)
  return (await rpcOrThrow(event, 'list_lecturers')) ?? []
})
