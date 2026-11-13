// Quản lý user / phân quyền (tbl_misc, cat = 'USERS'): mọi thao tác đi qua server (/api/users),
// server kiểm tra quyền menu User Manager và phân cấp Rank; trình duyệt không còn đọc/ghi bảng này bằng anon key.
// Giữ nguyên chữ ký hàm cũ để trang User Manager không phải đổi nhiều (lastUser nay do server lấy từ session nên bị bỏ qua).

const MESSAGES = {
  USER_DUPLICATED: 'This email already exists.',
  USER_NOT_FOUND: 'User not found. Please reload.',
  FORBIDDEN: 'You do not have permission to do this. Only SYS / SYSADMIN can manage SYS / SYSADMIN users or edit their own account.',
  INVALID_BODY: 'Invalid data.',
}

// Lỗi từ server -> câu thông báo ngắn cho snackbar
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

export async function fetchUsers() {
  const { users } = await call(() => $fetch('/api/users'))
  return users.map((row) => ({
    id: row.id,
    email: row.email,
    i_status: row.i_status,
    obj_json: row.obj_json,
    arr_json: row.arr_json,
  }))
}

export async function createUser({ email, role, permissions }) {
  await call(() => $fetch('/api/users/create', { method: 'POST', body: { email, role, permissions } }))
}

// Email không đổi được sau khi tạo; server giữ nguyên các khóa khác của arr_json (vd ISB_APP), chỉ ghi đè PERMISSIONS
export async function updateUser(id, { role, permissions }) {
  await call(() => $fetch('/api/users/update', { method: 'POST', body: { id, role, permissions } }))
}

export async function retireUser(id) {
  await call(() => $fetch('/api/users/retire', { method: 'POST', body: { id } }))
}
