// Lớp mỏng gọi repository + transformer; lỗi được đổi thành Error có câu thông báo để page hiện snackbar
import { subjectAdminRepository as repo } from '~/data/repositories/subjectAdminRepository'
import {
  validateSubjectForm, toSubjectRow, validateFeePeriods, normalizeFeePeriods, subjectErrorMessage,
} from '~/data/transformers/subjectTransformer'

export const useSubjectAdmin = () => {
  const wrap = async (fn) => {
    try {
      return await fn()
    } catch (e) {
      throw new Error(subjectErrorMessage(e))
    }
  }

  return {
    fetchSubjects: (domain) => wrap(async () => (await repo.list(domain)).subjects.map(toSubjectRow)),

    createSubject: async (domain, form) => {
      const err = validateSubjectForm(form, domain)
      if (err) throw new Error(err)
      return await wrap(() => repo.create(domain, form))
    },

    deleteSubject: (domain, id) => wrap(() => repo.remove(domain, id)),

    saveFees: async (domain, id, periods) => {
      const err = validateFeePeriods(periods)
      if (err) throw new Error(err)
      const res = await wrap(() => repo.saveFees(domain, id, normalizeFeePeriods(periods)))
      return res.fees
    },
  }
}
