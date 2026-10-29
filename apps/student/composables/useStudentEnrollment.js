// Trang Enrollment: danh sách khóa được đăng ký, đăng ký một khóa, xem lịch của khóa đã đăng ký.
// Trạng thái "đã đăng ký" và quyền đăng ký luôn do server quyết định; ở đây chỉ gọi và hiển thị.
import { studentSelfRepository as repo } from '~/data/repositories/studentSelfRepository'
import { splitCourses, enrollmentErrorMessage } from '~/data/transformers/studentScheduleTransformer'
import { isUnauthorized } from '#core/data/transformers/studentSelfEdit'

export const useStudentEnrollment = () => {
  const snackbar = useSnackbarStore()
  const { clear } = useUserSession()
  const notify = (message, color = 'success') => snackbar.trigger({ message, color })

  const loading = ref(false)
  const loaded = ref(false)
  const requiredCount = ref(0)
  const courses = ref([])
  const enrollingId = ref(0)

  const groups = computed(() => splitCourses(courses.value))

  const handleError = async (e) => {
    if (isUnauthorized(e)) {
      await clear()
      await navigateTo('/login')
      return
    }
    notify(enrollmentErrorMessage(e), 'error')
  }

  const load = async () => {
    loading.value = true
    try {
      const res = await repo.getEnrollment()
      courses.value = res.courses ?? []
      requiredCount.value = res.requiredCount ?? 0
      loaded.value = true
    } catch (e) {
      await handleError(e)
    } finally {
      loading.value = false
    }
  }

  // Trả true nếu đăng ký thành công. Danh sách luôn được tải lại để phản ánh đúng trạng thái trên server.
  const enroll = async (course) => {
    if (enrollingId.value) return false
    enrollingId.value = course.id
    try {
      await repo.enroll(course.id)
      notify(`You are now enrolled in ${course.courseName}.`)
      await load()
      return true
    } catch (e) {
      await handleError(e)
      await load() // ví dụ: đã đăng ký ở thiết bị khác -> danh sách cập nhật lại
      return false
    } finally {
      enrollingId.value = 0
    }
  }

  // Toàn bộ lịch của một khóa đang đăng ký: { course, sessions } hoặc null nếu lỗi
  const fetchCourseSchedule = async (course) => {
    try {
      return await repo.getCourseSchedule(course.id)
    } catch (e) {
      await handleError(e)
      return null
    }
  }

  return { loading, loaded, requiredCount, courses, groups, enrollingId, load, enroll, fetchCourseSchedule }
}
