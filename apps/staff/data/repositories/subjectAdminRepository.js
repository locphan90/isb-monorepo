// Repository: nơi DUY NHẤT gọi API môn học của form Subjects (server kiểm tra quyền menu/nút và domain)
export const subjectAdminRepository = {
  // { domain, subjects: [{ id, prg, subjCode, objJson, arrJson }] }
  async list(domain) {
    return await $fetch('/api/subject', { query: { domain } })
  },
  async create(domain, payload) {
    return await $fetch('/api/subject/create', { method: 'POST', body: { domain, ...payload } })
  },
  async remove(domain, id) {
    return await $fetch('/api/subject/delete', { method: 'POST', body: { domain, id } })
  },
  async saveFees(domain, id, fees) {
    return await $fetch('/api/subject/fees', { method: 'POST', body: { domain, id, fees } })
  },
}
