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

  // Trạng thái upload: { [docKey]: { Uploaded, FileName } }
  async getMyDocuments() {
    const res = await $fetch('/api/student/documents')
    return res?.documents ?? {}
  },

  // Bước 1: xin phiên upload. Trả { uploadUrl, fileName, replace }
  async startDocumentUpload({ docKey, mimeType, size }) {
    return await $fetch('/api/student/documents/start', { method: 'POST', body: { docKey, mimeType, size } })
  },

  // Bước 2: báo đã upload xong để server kiểm tra và ghi nhận. Trả { documents }
  async completeDocumentUpload({ docKey, fileId }) {
    return await $fetch('/api/student/documents/complete', { method: 'POST', body: { docKey, fileId } })
  },

  // ── Đăng ký khóa học ──────────────────────────────────────────────────────
  // { today, requiredCount, courses: [{ id, courseName, subject, startDate, endDate, status, enrolled, sessionCount }] }
  async getEnrollment() {
    return await $fetch('/api/student/enrollment')
  },

  async enroll(courseId) {
    return await $fetch('/api/student/enrollment', { method: 'POST', body: { courseId } })
  },

  // Toàn bộ lịch của một khóa đang đăng ký: { course, sessions }
  async getCourseSchedule(courseId) {
    return await $fetch('/api/student/enrollment/schedule', { query: { courseId } })
  },

  // ── Lịch học ──────────────────────────────────────────────────────────────
  // { from, to, sessions } trong khoảng [from, from + days - 1]
  async getSchedule({ from, days }) {
    return await $fetch('/api/student/schedule', { query: { from, days } })
  },
}
