// Nơi DUY NHẤT gọi dữ liệu khóa học / môn học cho Create Course và Course Schedule
// data/ không được Nuxt tự quét nên phải import tay
// Mọi thao tác đi qua server (/api/course*): trình duyệt không còn đọc / ghi tbl_subject, tbl_course bằng anon key.

// Môn học theo domain đang đăng nhập (kèm program: cùng mã môn có thể có ở nhiều program). => [{ subj_code, prg, obj_json }]
// Cần quyền menu Create Course hoặc Course Schedule; server không trả học phí
export async function fetchSubjectsByDomain(domain) {
  const res = await $fetch('/api/course/subjects', { query: { domain } })
  return res?.subjects || []
}

// Tên các khóa đang dùng bắt đầu bằng một tiền tố (để xem trước số thứ tự tiếp theo; DB mới là nơi chốt số). => string[]
export async function fetchCourseNamesByPrefix(prefix) {
  const res = await $fetch('/api/course/names', { query: { prefix } })
  return res?.names || []
}

// Rate hiệu lực cho (môn, quý): tra theo loại môn của môn học. => { subjectType, rate } (rate null nếu chưa có)
export async function fetchCourseRate({ domain, prg, subjCode, quarter }) {
  return await $fetch('/api/course/rate', { query: { domain, prg, subjCode, quarter } })
}

// Danh sách email PIC của domain (tbl_misc cat = 'PIC'), qua server vì có kiểm tra quyền menu. => string[] (rỗng nếu domain chưa khai PIC)
export async function fetchCoursePics(domain) {
  const res = await $fetch('/api/course/pic', { query: { domain } })
  return res?.emails || []
}

// Danh sách khóa của domain (mặc định chỉ khóa chưa kết thúc; includePast = true để xem cả khóa cũ). => { today, courses: [...] }
export async function fetchCourseListViaApi(domain, includePast) {
  return await $fetch('/api/course/list', { query: { domain, ...(includePast ? { includePast: '1' } : {}) } })
}

// Sửa khóa (hệ số, PIC, giảng viên) qua server. => { course }
export async function updateCourseViaApi(payload) {
  return await $fetch('/api/course/update', { method: 'POST', body: payload })
}

// Tạo khóa qua server (kiểm tra quyền menu, domain, môn học; DB cấp số thứ tự và tra Rate). => { course: { id, courseName, rate } }
export async function createCourseViaApi(payload) {
  return await $fetch('/api/course/create', { method: 'POST', body: payload })
}
