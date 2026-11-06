// Lớp mỏng gọi repository + transformer; lỗi được đổi thành Error có câu thông báo để page hiện snackbar
import { rateRepository as repo } from '~/data/repositories/rateRepository'
import { validateRateForm, toRateRow, findRateOverlap, rateErrorMessage } from '~/data/transformers/rateTransformer'

export const useRate = () => {
  const wrap = async (fn) => {
    try {
      return await fn()
    } catch (e) {
      throw new Error(rateErrorMessage(e))
    }
  }

  return {
    fetchRates: (domain) => wrap(async () => (await repo.list(domain)).rates.map(toRateRow)),

    // existingRows: danh sách đang hiển thị, để báo chồng giai đoạn ngay (server vẫn kiểm tra lại)
    createRate: async (domain, form, existingRows = []) => {
      const err = validateRateForm(form)
      if (err) throw new Error(err)
      if (findRateOverlap(existingRows, form)) throw new Error(rateErrorMessage({ message: 'RATE_OVERLAP' }))
      return await wrap(() => repo.create(domain, form))
    },

    deleteRate: (domain, id) => wrap(() => repo.remove(domain, id)),
  }
}
