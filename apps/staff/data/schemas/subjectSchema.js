// Khai báo form môn học (chỉ khai báo, không có logic). Bảng: tbl_subject (xem sql/20261102_subject_form.sql)
// File này dùng cả ở trình duyệt lẫn server nên không import gì từ Vue/Nuxt.

export const SUBJECT_MENU_KEY = 'academic-subject' // khớp key trong config/menu.js
export const SUBJECT_BUTTONS = { SAVE: 'save', FEES: 'fees', DELETE: 'delete' }

export const SUBJECT_TYPES = ['Academic', 'Executive', 'PRE-MBA', 'Case']
export const SUBJECT_STAGES = [0, 1, 2, 3]

// Gợi ý Program (prg) theo domain; vẫn nhập tay được (domain khác như ISP không có gợi ý)
export const PROGRAMS_BY_DOMAIN = {
  MBA: ['PSO', 'Talent'],
  EAP: ['PSO', 'Talent'],
  WSU: ['BBUS', 'BCOMM', 'BDATA'],
}

// Giới hạn dữ liệu (server kiểm tra lại)
export const SUBJECT_CODE_MAX = 30
export const SUBJECT_TEXT_MAX = 200
export const SUBJECT_MAX_FEE_PERIODS = 50
export const SUBJECT_MAX_AMOUNT = 1e12

// Valid From / Valid Thru lưu dạng quý 'YYYYQn' (vd '2026Q4'), không lưu ngày cụ thể.
// Ô chọn liệt kê từ quý hiện tại, đủ 2 năm (8 quý).
export const FEE_QUARTER_OPTIONS_COUNT = 8

export const emptySubjectForm = () => ({
  subjCode: '',
  subjName: '',
  code: '',
  type: null,
  stage: null,
  prg: null, // null (không phải '') để nhãn ô Program nằm trong ô khi chưa chọn
})

// Một giai đoạn học phí: ValidFrom/ValidThru là quý 'YYYYQn'; ValidThru '' = chưa có quý kết thúc
export const emptyFeePeriod = () => ({ Fee: null, RetakeFee: null, ValidFrom: '', ValidThru: '' })
