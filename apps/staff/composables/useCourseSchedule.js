// Lớp mỏng gọi repository; lỗi được đổi thành Error có câu thông báo để page hiện snackbar
import { courseScheduleRepository as repo } from '~/data/repositories/courseScheduleRepository'
import { scheduleErrorMessage, isUnauthorized } from '~/data/transformers/courseScheduleTransformer'

export const useCourseSchedule = () => {
  const wrap = async (fn) => {
    try {
      return await fn()
    } catch (e) {
      const err = new Error(scheduleErrorMessage(e))
      err.unauthorized = isUnauthorized(e)
      throw err
    }
  }

  return {
    fetchCourses: (includePast) => wrap(() => repo.getCourses(includePast)),
    fetchSchedule: (course) => wrap(() => repo.getSchedule(course)),
    saveSchedule: (payload) => wrap(() => repo.save(payload)),
  }
}
