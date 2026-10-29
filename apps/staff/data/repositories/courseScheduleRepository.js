// Repository: nơi DUY NHẤT gọi API lịch học (server kiểm tra quyền menu/nút, trình duyệt không chạm bảng lịch)
export const courseScheduleRepository = {
  // { today, courses: [{ id, courseName, subject, startDate, endDate, status, sessionCount, lecturers }] }
  async getCourses(includePast) {
    return await $fetch('/api/course-schedule/courses', { query: { includePast: includePast ? '1' : '0' } })
  },

  // { course, sessions, rooms, lecturers }
  async getSchedule(courseId) {
    return await $fetch('/api/course-schedule', { query: { courseId } })
  },

  // payload: { courseId, upserts, deletes } -> { sessions }
  async save(payload) {
    return await $fetch('/api/course-schedule/save', { method: 'POST', body: payload })
  },
}
