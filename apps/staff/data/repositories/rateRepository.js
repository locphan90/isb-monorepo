// Repository: nơi DUY NHẤT gọi API Rate (server kiểm tra quyền menu/nút và domain của user)
export const rateRepository = {
  // { domain, rates: [{ id, objJson }] }
  async list(domain) {
    return await $fetch('/api/rate', { query: { domain } })
  },
  async create(domain, form) {
    return await $fetch('/api/rate/create', { method: 'POST', body: { domain, ...form } })
  },
  async remove(domain, id) {
    return await $fetch('/api/rate/delete', { method: 'POST', body: { domain, id } })
  },
}
