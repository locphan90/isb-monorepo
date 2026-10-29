// Trang Schedule: lịch của sinh viên theo khoảng ngày, mặc định từ hôm nay (giờ Việt Nam) trong 7 ngày tới.
import { studentSelfRepository as repo } from '~/data/repositories/studentSelfRepository'
import { DEFAULT_WINDOW, shiftFrom, enrollmentErrorMessage } from '~/data/transformers/studentScheduleTransformer'
import { todayVN } from '#core/data/transformers/scheduleDates'
import { isUnauthorized } from '#core/data/transformers/studentSelfEdit'

export const useStudentSchedule = () => {
  const snackbar = useSnackbarStore()
  const { clear } = useUserSession()

  const today = todayVN()
  const from = ref(today)
  const days = ref(DEFAULT_WINDOW)
  const sessions = ref([])
  const loading = ref(false)
  const loaded = ref(false)

  let requestId = 0 // chỉ nhận kết quả của lần tải mới nhất (bấm chuyển tuần liên tục)

  const load = async () => {
    const id = ++requestId
    loading.value = true
    try {
      const res = await repo.getSchedule({ from: from.value, days: days.value })
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

  const goToday = () => { from.value = today; return load() }
  const step = (dir) => { from.value = shiftFrom(from.value, days.value, dir); return load() }
  const setDays = (n) => { days.value = n; return load() }

  return { today, from, days, sessions, loading, loaded, load, goToday, step, setDays }
}
