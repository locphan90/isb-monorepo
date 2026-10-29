// server/utils/studentSchedule.js (app sinh viên)
// Kiểm tra tham số của các API lịch học / đăng ký khóa. Danh tính sinh viên luôn lấy từ session, không từ tham số.
import { addDays, todayVN } from '#core/data/transformers/scheduleDates'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MAX_DAYS = 62
const bad = (code) => createError({ statusCode: 400, statusMessage: code })

const isRealDate = (s) => {
  if (!DATE_RE.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}

// ?from=YYYY-MM-DD&days=7 -> { from, to }. Mặc định: từ hôm nay (giờ Việt Nam), 7 ngày.
export const parseScheduleRange = (query) => {
  const from = query?.from ? String(query.from) : todayVN()
  const days = query?.days === undefined || query?.days === '' ? 7 : Number(query.days)
  if (!isRealDate(from)) throw bad('INVALID_DATE')
  if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) throw bad('INVALID_RANGE')
  return { from, to: addDays(from, days - 1) }
}

export const parseCourseId = (v) => {
  const n = Number(v)
  if (!Number.isSafeInteger(n) || n <= 0) throw bad('INVALID_COURSE')
  return n
}
