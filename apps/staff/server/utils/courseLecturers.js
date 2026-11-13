// Làm sạch danh sách giảng viên của khóa (dùng cho tạo và sửa khóa). Mọi thứ client gửi lên đều bị kiểm tra lại.
// - Email phải thuộc giảng viên đang hoạt động (tbl_lecturer); tên lưu vào khóa lấy từ DB, không lấy từ client.
// - keepNames: Map email(thường) -> tên của các giảng viên ĐÃ có sẵn trong khóa. Giảng viên này vẫn được giữ lại khi sửa khóa
//   dù sau đó đã ngừng hoạt động (nếu không, chỉ sửa PIC cũng bị từ chối vì một giảng viên cũ).
export const normalizeCourseLecturers = async (event, rawList, keepNames = new Map()) => {
  const active = await loadActiveLecturers(event)
  return (rawList ?? []).map((l) => {
    const email = String(l.email).trim().toLowerCase()
    const name = active.get(email) ?? keepNames.get(email)
    if (!name) throwInvalid('One of the selected lecturers is not an active lecturer.')
    return {
      email,
      name,
      role: l.role,
      cost_up: Number(l.cost_up),
      cost_qty: Number(l.cost_qty),
      noofsection: Number(l.noofsection),
    }
  })
}
