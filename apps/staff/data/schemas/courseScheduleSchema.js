// Khai báo lịch học theo khóa (chỉ khai báo, không có logic).
// File này dùng cả ở trình duyệt lẫn server nên không import gì từ Vue/Nuxt.

export const COURSE_SCHEDULE_MENU_KEY = 'academic-course-schedule' // khớp key trong config/menu.js
export const COURSE_SCHEDULE_BUTTONS = { SAVE: 'save' }

// Giới hạn dữ liệu (server kiểm tra lại các giới hạn này)
export const SCHEDULE_ROOM_MAX = 50
export const SCHEDULE_NOTE_MAX = 500
export const SCHEDULE_MAX_CHANGES_PER_SAVE = 400

// Thứ trong tuần theo thứ tự hiển thị (Thứ hai trước). `day` = Date.getUTCDay() (0 = Chủ nhật)
export const WEEKDAYS = [
  { day: 1, short: 'Mon', label: 'Monday' },
  { day: 2, short: 'Tue', label: 'Tuesday' },
  { day: 3, short: 'Wed', label: 'Wednesday' },
  { day: 4, short: 'Thu', label: 'Thursday' },
  { day: 5, short: 'Fri', label: 'Friday' },
  { day: 6, short: 'Sat', label: 'Saturday' },
  { day: 0, short: 'Sun', label: 'Sunday' },
]

// Một buổi học trong form: date = 'YYYY-MM-DD', start/end = 'HH:MM' hoặc ''
export const emptySession = (date) => ({
  date,
  start: '',
  end: '',
  room: '',
  lecturerEmail: '',
  note: '',
})
