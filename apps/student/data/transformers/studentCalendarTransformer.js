// Hàm thuần cho lịch dạng Calendar (kiểu Google) của sinh viên: không đụng Vue / mạng.
// Ngày là chuỗi 'YYYY-MM-DD' (UTC), giờ là 'HH:MM'; "hôm nay" và "bây giờ" tính theo giờ Việt Nam.
import { addDays, calendarWeeks, formatDateLong, parseDate, weekdayOf } from '#core/data/transformers/scheduleDates.js'

export const CALENDAR_VIEWS = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
]
export const DEFAULT_VIEW = 'week'

// Khung giờ mặc định của lưới ngày/tuần; tự mở rộng nếu có buổi nằm ngoài
export const DEFAULT_START_HOUR = 7
export const DEFAULT_END_HOUR = 21
export const DEFAULT_EVENT_MINUTES = 60 // buổi có giờ bắt đầu nhưng thiếu/sai giờ kết thúc
export const MIN_EVENT_MINUTES = 30 // chiều cao tối thiểu khi vẽ (để đọc được chữ)

const pad = (n) => String(n).padStart(2, '0')

// 'HH:MM' -> số phút trong ngày; không hợp lệ -> null
export const toMinutes = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm ?? ''))
  if (!m) return null
  const v = Number(m[1]) * 60 + Number(m[2])
  return Number(m[2]) < 60 && v <= 1440 ? v : null
}

// Giờ hiện tại theo giờ Việt Nam, tính bằng phút trong ngày
export const nowMinutesVN = (now = new Date()) =>
  toMinutes(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now))

export const mondayOf = (date) => addDays(date, -((weekdayOf(date) + 6) % 7))

// Các ngày hiển thị: ngày = 1, tuần = 7 (Thứ hai -> Chủ nhật), tháng = cả lưới tháng (gồm ngày của tháng kề)
export const visibleDates = (view, anchor) => {
  if (view === 'day') return [anchor]
  if (view === 'week') {
    const first = mondayOf(anchor)
    return Array.from({ length: 7 }, (_, i) => addDays(first, i))
  }
  const [y, m] = anchor.split('-').map(Number)
  return calendarWeeks(y, m).flat().map((c) => c.date)
}

// Khoảng cần tải từ server: { dates, from, days } (tối đa 42 ngày, nằm trong giới hạn 62 ngày của API)
export const visibleRange = (view, anchor) => {
  const dates = visibleDates(view, anchor)
  return { dates, from: dates[0], days: dates.length }
}

// Lùi / tiến một kỳ (dir = -1 hoặc 1). Tháng: về ngày 1 của tháng kế
export const shiftAnchor = (view, anchor, dir) => {
  if (view === 'day') return addDays(anchor, dir)
  if (view === 'week') return addDays(anchor, 7 * dir)
  let [y, m] = anchor.split('-').map(Number)
  m += dir
  if (m < 1) { m = 12; y -= 1 }
  if (m > 12) { m = 1; y += 1 }
  return `${y}-${pad(m)}-01`
}

const fmt = (date, opts) => new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: 'UTC' }).format(parseDate(date))

// Tiêu đề kỳ đang xem: "Wed, 04 Nov 2026" / "02 – 08 Nov 2026" / "November 2026"
export const periodLabel = (view, anchor) => {
  if (view === 'day') return formatDateLong(anchor)
  if (view === 'month') return fmt(anchor, { month: 'long', year: 'numeric' })
  const dates = visibleDates('week', anchor)
  const a = dates[0]
  const b = dates[6]
  if (a.slice(0, 7) === b.slice(0, 7)) return `${fmt(a, { day: '2-digit' })} – ${fmt(b, { day: '2-digit', month: 'short', year: 'numeric' })}`
  if (a.slice(0, 4) === b.slice(0, 4)) return `${fmt(a, { day: '2-digit', month: 'short' })} – ${fmt(b, { day: '2-digit', month: 'short', year: 'numeric' })}`
  return `${fmt(a, { day: '2-digit', month: 'short', year: 'numeric' })} – ${fmt(b, { day: '2-digit', month: 'short', year: 'numeric' })}`
}

// Kỳ đang xem có chứa hôm nay không (để tắt nút Today)
export const isCurrentPeriod = (view, anchor, today) =>
  view === 'month' ? anchor.slice(0, 7) === today.slice(0, 7) : visibleDates(view, anchor).includes(today)

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const weekdayShort = (date) => WEEKDAY_SHORT[weekdayOf(date)]
export const dayNumber = (date) => Number(date.slice(8, 10))

// Khoảng phút của một buổi có giờ; null nếu không có giờ bắt đầu ("Time to be announced")
export const eventSpan = (s) => {
  const start = toMinutes(s.start)
  if (start === null) return null
  let end = toMinutes(s.end)
  if (end === null || end <= start) end = start + DEFAULT_EVENT_MINUTES
  return { start, end: Math.min(end, 1440) }
}

export const isTimed = (s) => toMinutes(s.start) !== null

// Gom buổi theo ngày: { 'YYYY-MM-DD': [session] } (giữ thứ tự server trả về)
export const sessionsByDate = (sessions) => {
  const map = {}
  for (const s of sessions) (map[s.date] ||= []).push(s)
  return map
}

// Khung giờ của lưới: mặc định 07:00–21:00, mở rộng nếu có buổi sớm/muộn hơn. { startHour, endHour } (endHour <= 24)
export const hourRange = (sessions) => {
  let lo = DEFAULT_START_HOUR * 60
  let hi = DEFAULT_END_HOUR * 60
  for (const s of sessions) {
    const span = eventSpan(s)
    if (!span) continue
    lo = Math.min(lo, span.start)
    hi = Math.max(hi, span.end)
  }
  return { startHour: Math.floor(lo / 60), endHour: Math.min(24, Math.ceil(hi / 60)) }
}

// Xếp các buổi có giờ của MỘT ngày thành cột khi trùng giờ (như Google Calendar).
// => [{ s, start, end, col, cols }]: col = cột của buổi, cols = tổng số cột của nhóm trùng nhau
export const layoutDay = (sessions) => {
  const items = sessions
    .map((s) => ({ s, ...eventSpan(s) }))
    .filter((x) => x.start !== undefined)
    .sort((a, b) => a.start - b.start || b.end - a.end)

  const out = []
  let cluster = []
  let clusterEnd = -1
  const flush = () => {
    if (!cluster.length) return
    const colEnds = []
    for (const ev of cluster) {
      let c = colEnds.findIndex((e) => e <= ev.start)
      if (c === -1) { c = colEnds.length; colEnds.push(ev.end) } else colEnds[c] = ev.end
      ev.col = c
    }
    for (const ev of cluster) { ev.cols = colEnds.length; out.push(ev) }
    cluster = []
  }
  for (const ev of items) {
    if (ev.start >= clusterEnd) flush()
    cluster.push(ev)
    clusterEnd = cluster.length === 1 ? ev.end : Math.max(clusterEnd, ev.end)
  }
  flush()
  return out
}

// Mỗi khóa một màu cố định (theo id) để nhìn là biết buổi nào của khóa nào. Chữ trắng đọc được trên mọi màu.
export const COURSE_COLORS = ['#1a73e8', '#0b8043', '#d93025', '#8e24aa', '#e8710a', '#3949ab', '#00897b', '#6d4c41']
export const courseColor = (courseId) => COURSE_COLORS[Math.abs(Number(courseId) || 0) % COURSE_COLORS.length]

export const hourLabel = (h) => `${pad(h)}:00`
