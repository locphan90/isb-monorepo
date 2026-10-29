// Repository: nơi DUY NHẤT gọi API hồ sơ giảng viên (bảng tbl_lecturer).
// Trình duyệt không chạm bảng: server kiểm tra quyền rồi gọi hàm SQL bằng service role.
export const lecturerRepository = {
  // Giảng viên đang hoạt động, chỉ phần nhẹ (id, email, full_name, type) -> dùng cho ô chọn
  async list() {
    return await $fetch('/api/lecturer')
  },

  // Hồ sơ đầy đủ một giảng viên (gồm dữ liệu nhạy cảm) -> { id, email, full_name, type, ..., obj_json }
  async get(id) {
    return await $fetch(`/api/lecturer/${id}`)
  },

  // payload: { id?, email, fullName, type, highestDegree, contractStart, contractEnd, objJson } -> { id }
  async save(payload) {
    return await $fetch('/api/lecturer/save', { method: 'POST', body: payload })
  }
}
