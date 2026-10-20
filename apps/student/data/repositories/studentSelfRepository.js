// Repository: nơi DUY NHẤT gọi API của phía sinh viên.
// Trình duyệt không chạm Supabase: server đọc danh tính từ session rồi dùng service role.
export const studentSelfRepository = {
  // Trả về null nếu không tìm thấy sinh viên khớp email của phiên đăng nhập
  async getMyProfile() {
    const res = await $fetch('/api/student/me')
    return res?.student ?? null
  },

  // changes: { [key]: 'giá trị mới' } chỉ gồm các trường đã đổi
  async updateMyProfile(changes) {
    return await $fetch('/api/student/profile', { method: 'PATCH', body: { changes } })
  },
}
