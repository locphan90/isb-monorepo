// Repository: cấu hình "sinh viên được xem/sửa trường nào" (qua API server có kiểm tra quyền menu/nút)
export const studentSelfEditSettingRepository = {
  // { keys: [...key có trong objProfile], setting: { view, edit, neverView, neverEdit } }
  async get() {
    return await $fetch('/api/student-self-edit')
  },

  // payload: { view: [...], edit: [...] }
  async save(payload) {
    return await $fetch('/api/student-self-edit', { method: 'PUT', body: payload })
  },
}
