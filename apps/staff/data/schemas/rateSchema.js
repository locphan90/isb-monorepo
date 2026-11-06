// Khai báo form Rate. Lưu trong tbl_misc với cat = 'RATE' (xem sql/20261103_rate_form.sql)
// File này dùng cả ở trình duyệt lẫn server nên không import gì từ Vue/Nuxt.
import { SUBJECT_TYPES } from './subjectSchema.js'

export const RATE_CAT = 'RATE'
export const RATE_MENU_KEY = 'academic-rate' // khớp key trong config/menu.js
export const RATE_BUTTONS = { SAVE: 'save', DELETE: 'delete' }

// Cùng danh sách loại môn với form Subjects
export const RATE_SUBJECT_TYPES = SUBJECT_TYPES
export const RATE_MAX_AMOUNT = 1e12

export const emptyRateForm = () => ({
  subjectType: null,
  rate: null,
  validFrom: '',
  validThru: '',
})
