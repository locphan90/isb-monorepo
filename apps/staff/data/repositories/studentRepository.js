// Hồ sơ sinh viên: mọi thao tác đi qua server (/api/students*). Server kiểm tra quyền menu / nút của phòng ban, lọc dữ liệu theo nhóm
// trường phòng ban được phép và kiểm tra dữ liệu gửi lên; trình duyệt không còn đọc / ghi tbl_student bằng anon key.
// menuKey = menu (phòng ban) của trang đang dùng, ví dụ 'registrar-student-list'.

const MESSAGES = {
  STUDENT_DUPLICATED: 'A student with this MSSV already exists.',
  STUDENT_NOT_FOUND: 'Student not found. It may have been deleted. Please reload.',
  FORBIDDEN: 'You do not have permission to do this.',
  INVALID_BODY: 'Invalid data.',
}

// Lỗi từ server -> Error có câu thông báo ngắn cho giao diện
const toError = (e) => {
  const text = [e?.data?.statusMessage, e?.statusMessage].filter(Boolean).join(' | ')
  const code = Object.keys(MESSAGES).find((c) => text.includes(c))
  if (code) return new Error(MESSAGES[code])
  if (e?.data?.statusMessage?.startsWith('INVALID:')) return new Error(e.data.statusMessage.slice(8).trim())
  return new Error('Something went wrong. Please try again.')
}

const call = async (fn) => {
  try {
    return await fn()
  } catch (e) {
    throw toError(e)
  }
}

// { data: [{ id, mssv, obj_json }], count } — obj_json chỉ gồm các nhóm trường phòng ban được xem
export async function fetchStudentList({ search = '', page = 1, pageSize = 20, menuKey } = {}) {
  const res = await call(() => $fetch('/api/students', { query: { menuKey, search, page, pageSize } }))
  return { data: res.data ?? [], count: res.count ?? 0 }
}

// { id, mssv, obj_json, i_status } hoặc null nếu không có sinh viên này
export async function fetchStudentByMssv(mssv, menuKey) {
  try {
    return await $fetch(`/api/students/${encodeURIComponent(mssv)}`, { query: { menuKey } })
  } catch (e) {
    if (e?.statusCode === 404 || e?.data?.statusMessage === 'STUDENT_NOT_FOUND') return null
    throw toError(e)
  }
}

// Tạo sinh viên mới (cần quyền menu Add Student). domain = domain đang chọn; server xác nhận lại theo user
export async function createStudent(mssv, objJson, domain = null) {
  const res = await call(() => $fetch('/api/students/create', { method: 'POST', body: { mssv, objJson, domain } }))
  return res.student
}

// Chỉ các nhóm trường phòng ban được phép mới được ghi; trường không gửi lên giữ nguyên
export async function updateStudent(id, objJson, menuKey) {
  await call(() => $fetch('/api/students/update', { method: 'POST', body: { menuKey, id, objJson } }))
}

// Xóa sinh viên - cập nhật i_status = 1 (retire)
export async function retireStudent(id, menuKey) {
  await call(() => $fetch('/api/students/retire', { method: 'POST', body: { menuKey, id } }))
}
