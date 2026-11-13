// Cấu hình nhóm dữ liệu sinh viên mà mỗi phòng ban (menu) được xem: đi qua server (/api/student-profile-settings).
// Trình duyệt không còn đọc / ghi bảng cấu hình bằng anon key. Chỉ người có quyền trang Student Data Display mới lưu được.

// => { [groupKey]: boolean }
export async function fetchDeptSettings(menuKey) {
  const { fields } = await $fetch('/api/student-profile-settings', { query: { menuKey } })
  return fields ?? {}
}

export async function saveDeptSettings(menuKey, fields) {
  try {
    await $fetch('/api/student-profile-settings', { method: 'POST', body: { menuKey, fields } })
  } catch (e) {
    const code = e?.data?.statusMessage || ''
    throw new Error(code.includes('FORBIDDEN') ? 'You do not have permission to change this setting.' : 'Failed to save the setting.')
  }
}
