// Lịch dạng Calendar (Day / Week / Month) của sinh viên: tải đúng khoảng ngày đang hiển thị từ /api/student/schedule.
// Không đụng useStudentSchedule (lịch danh sách) nên hai kiểu xem độc lập nhau.
import { studentSelfRepository as repo } from '~/data/repositories/studentSelfRepository'
import { DEFAULT_VIEW, visibleRange, shiftAnchor } from '~/data/transformers/studentCalendarTransformer'
import { enrollmentErrorMessage } from '~/data/transformers/studentScheduleTransformer'
import { todayVN } from '#core/data/transformers/scheduleDates'
import { isUnauthorized } from '#core/data/transformers/studentSelfEdit'

export const useStudentCalendar = () => {
  const snackbar = useSnackbarStore()
  const { clear } = useUserSession()

  const today = todayVN()
  const view = ref(DEFAULT_VIEW)
  const anchor = ref(today) // một ngày bất kỳ nằm trong kỳ đang xem
  const sessions = ref([])
  const loading = ref(false)
  const loaded = ref(false)

  const range = computed(() => visibleRange(view.value, anchor.value))

  let requestId = 0 // chỉ nhận kết quả của lần tải mới nhất (bấm chuyển kỳ liên tục)

  const load = async () => {
    const id = ++requestId
    loading.value = true
    try {
      const res = await repo.getSchedule({ from: range.value.from, days: range.value.days })
      if (id !== requestId) return
      sessions.value = res.sessions ?? []
      loaded.value = true
    } catch (e) {
      if (id !== requestId) return
      if (isUnauthorized(e)) {
        await clear()
        await navigateTo('/login')
        return
      }
      snackbar.trigger({ message: enrollmentErrorMessage(e), color: 'error' })
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  // Đổi kỳ hoặc kiểu xem thì tải lại; component tự gọi load() lần đầu
  watch([view, anchor], load)

  const goToday = () => { anchor.value = today }
  const step = (dir) => { anchor.value = shiftAnchor(view.value, anchor.value, dir) }
  const setView = (v) => { view.value = v }
  // Bấm vào một ngày (ở lịch tháng hoặc tiêu đề cột) -> xem ngày đó
  const openDay = (date) => { anchor.value = date; view.value = 'day' }

  return { today, view, anchor, range, sessions, loading, loaded, load, goToday, step, setView, openDay }
}
