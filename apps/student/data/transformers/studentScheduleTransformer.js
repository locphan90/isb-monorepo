// Hàm thuần cho trang Schedule và Enrollment của sinh viên (không đụng Vue / mạng).
import { addDays, formatDateLong } from '#core/data/transformers/scheduleDates'

// Các độ dài khoảng xem lịch (ngày) sinh viên được chọn; mặc định 7 ngày tới
export const WINDOW_OPTIONS = [7, 14, 30]
export const DEFAULT_WINDOW = 7

// Nhóm các buổi theo ngày (giữ thứ tự server trả về): [{ date, items: [session] }]
export const groupByDate = (sessions) => {
  const groups = []
  for (const s of sessions) {
    const last = groups[groups.length - 1]
    if (last && last.date === s.date) last.items.push(s)
    else groups.push({ date: s.date, items: [s] })
  }
  return groups
}

export const dayLabel = (date, today) => {
  if (date === today) return 'Today'
  if (date === addDays(today, 1)) return 'Tomorrow'
  return formatDateLong(date)
}

export const formatTimeRange = (s) => {
  if (!s.start) return 'Time to be announced'
  return s.end ? `${s.start} – ${s.end}` : s.start
}

// "Mon, 26 Oct 2026 – Sun, 01 Nov 2026"
export const rangeLabel = (from, days) => `${formatDateLong(from)} – ${formatDateLong(addDays(from, days - 1))}`

// Lùi / tiến cả một khoảng (dir = -1 hoặc 1)
export const shiftFrom = (from, days, dir) => addDays(from, dir * days)

// Dữ liệu cho component ScheduleCalendar (packages/core)
export const toCalendarSessions = (sessions) =>
  sessions.map((s, i) => ({
    key: `${s.date}-${s.start || 'x'}-${i}`,
    date: s.date,
    start: s.start || '',
    room: s.room || '',
    lecturerName: s.lecturerName || '',
  }))

// Tách khóa đã đăng ký và khóa còn mở đăng ký (giữ thứ tự server trả về: theo ngày bắt đầu)
export const splitCourses = (courses) => ({
  enrolled: courses.filter((c) => c.enrolled),
  open: courses.filter((c) => !c.enrolled),
})

const ERROR_MESSAGES = {
  ALREADY_ENROLLED: 'You are already enrolled in this course.',
  NOT_ELIGIBLE: 'This course does not match your required subjects.',
  COURSE_NOT_FOUND: 'This course is no longer open for registration.',
  NOT_ENROLLED: 'You are not enrolled in this course.',
  EMAIL_NOT_REGISTERED: 'This email is not registered. Please contact the Registrar.',
  INVALID_DATE: 'The date is not valid.',
  INVALID_RANGE: 'The date range is not valid.',
  INVALID_COURSE: 'The course is not valid.',
  DB_ERROR: 'The server could not process the request. Please try again.',
}

export const enrollmentErrorMessage = (e) => {
  const text = [e?.data?.statusMessage, e?.statusMessage, e?.message].filter(Boolean).join(' | ')
  const code = Object.keys(ERROR_MESSAGES).find((c) => text.includes(c))
  return code ? ERROR_MESSAGES[code] : 'Something went wrong. Please try again.'
}
