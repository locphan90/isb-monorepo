// Danh sách "môn cần phải học" do người dùng tự nhập ở System > Required
// Subjects — lưu THÀNH 1 DÒNG DUY NHẤT trong tbl_misc (không phải 1 dòng/
// môn), arr_json chứa cả mảng:
//   cat='SUBJECTS', val='REQUIRED_LIST',
//   arr_json={ subjects: [{ code, name, prg, major, domain }] }
//   prg: 'PSO' | 'Talent'; major: 'ANY'; domain: domain của người nhập
//   (chứa môn của MỌI domain trong cùng 1 dòng — lọc theo domain ở composable)
//
// Danh sách này sau đó được đọc lại ở form Add/Edit sinh viên
// (components/StudentProfile/StudentProfileForm.vue) để vẽ checkbox chọn
// môn cho từng sinh viên.

// Mọi thao tác đi qua server (/api/required-subjects): trình duyệt không còn đọc / ghi tbl_misc bằng anon key.
// Đọc: nhân viên còn hoạt động; ghi: cần quyền menu System > Required Subjects. Server tự gộp môn của các domain.

const MESSAGES = {
  FORBIDDEN: 'You do not have permission to do this.',
  DOMAIN_NOT_ALLOWED: 'You do not have access to this domain.',
  INVALID_BODY: 'Invalid data.',
}

// Lỗi từ server -> Error có câu thông báo ngắn cho giao diện
const toError = (e) => {
  const text = [e?.data?.statusMessage, e?.statusMessage].filter(Boolean).join(' | ')
  const code = Object.keys(MESSAGES).find((c) => text.includes(c))
  const err = e?.data?.statusMessage?.startsWith('INVALID:')
    ? new Error(e.data.statusMessage.slice(8).trim())
    : new Error(code ? MESSAGES[code] : 'Something went wrong. Please try again.')
  err.unauthorized = e?.statusCode === 401 || e?.status === 401
  return err
}

// => [{ code, name, prg, major, domain }] của MỌI domain
export async function fetchRequiredSubjects() {
  try {
    const res = await $fetch('/api/required-subjects')
    return res?.subjects ?? []
  } catch (e) {
    throw toError(e)
  }
}

// Lưu danh sách môn của MỘT domain (list: [{ code, name, prg, major }]). => danh sách mới của MỌI domain (đã gộp ở server)
export async function saveRequiredSubjects(list, domain) {
  try {
    const res = await $fetch('/api/required-subjects', { method: 'POST', body: { domain, subjects: list } })
    return res?.subjects ?? []
  } catch (e) {
    throw toError(e)
  }
}
