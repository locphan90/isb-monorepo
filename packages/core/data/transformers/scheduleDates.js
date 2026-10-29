// Hàm thuần xử lý NGÀY cho lịch học (không đụng Vue/Nuxt). Dùng chung cho app staff và app sinh viên.
// Ngày luôn là chuỗi 'YYYY-MM-DD' và tính theo UTC để không bị lệch múi giờ của trình duyệt.

const pad = (n) => String(n).padStart(2, '0')
const DAY_MS = 86400000

export const parseDate = (s) => {
  const [y, m, d] = String(s).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
export const formatDate = (dt) => dt.toISOString().slice(0, 10)
export const addDays = (s, n) => formatDate(new Date(parseDate(s).getTime() + n * DAY_MS))
export const weekdayOf = (s) => parseDate(s).getUTCDay() // 0 = Chủ nhật

// Mọi ngày từ start đến end (gồm cả hai đầu). Trả [] nếu khoảng không hợp lệ.
export const datesInRange = (start, end) => {
  if (!start || !end || end < start) return []
  const out = []
  const last = parseDate(end).getTime()
  for (let t = parseDate(start).getTime(); t <= last; t += DAY_MS) out.push(formatDate(new Date(t)))
  return out
}

export const datesOnWeekdays = (start, end, weekdays) => {
  const set = new Set(weekdays)
  return datesInRange(start, end).filter((d) => set.has(weekdayOf(d)))
}

// Hôm nay theo giờ Việt Nam
export const todayVN = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())

// Ví dụ: 'Mon, 05 Jan 2026'
export const formatDateLong = (s) =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(parseDate(s))

// Các tháng chạm vào khoảng start..end: [{ key: '2026-01', year, month (1-12), label: 'January 2026' }]
export const monthsBetween = (start, end) => {
  if (!start || !end || end < start) return []
  const out = []
  let [y, m] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  while (y < ey || (y === ey && m <= em)) {
    out.push({
      key: `${y}-${pad(m)}`,
      year: y,
      month: m,
      label: new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 1))),
    })
    m += 1
    if (m > 12) { m = 1; y += 1 }
  }
  return out
}

// Lưới tháng, tuần bắt đầu từ Thứ hai: mảng các tuần, mỗi tuần 7 ô { date, inMonth, day }
export const calendarWeeks = (year, month) => {
  const first = new Date(Date.UTC(year, month - 1, 1))
  const offset = (first.getUTCDay() + 6) % 7 // số ô trống trước ngày 1 (Thứ hai = 0)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const total = Math.ceil((offset + daysInMonth) / 7) * 7
  const startTs = first.getTime() - offset * DAY_MS
  const cells = []
  for (let i = 0; i < total; i++) {
    const dt = new Date(startTs + i * DAY_MS)
    cells.push({ date: formatDate(dt), day: dt.getUTCDate(), inMonth: dt.getUTCMonth() === month - 1 })
  }
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}
