// Schema: chỉ khai báo cấu trúc, không chứa logic
// (nhãn và kiểu của từng trường objProfile dùng lại từ data/schemas/studentProfileSchema.js)

// Menu Setting: key phải khớp config/menu.js và server/api/student-self-edit/*
export const STUDENT_SELF_EDIT_MENU_KEY = 'system-student-self-edit'
export const STUDENT_SELF_EDIT_BUTTONS = Object.freeze({ SAVE: 'save' })

// Mỗi trường trong objProfile ở 1 trong 3 trạng thái (mặc định hidden, nên dữ liệu nội bộ không lộ ra)
export const FIELD_ACCESS = Object.freeze({
  HIDDEN: 'hidden',
  VIEW: 'view',
  EDIT: 'edit',
})

// Các nhóm nằm ngoài objProfile mà sinh viên được XEM (không bao giờ sửa), theo groupJsonPath trong studentProfileSchema.
// Admin chọn từng trường ở trang Setting. PHẢI khớp student_self_view_groups() trong file SQL 20261015.
export const STUDENT_VIEW_GROUP_PATHS = Object.freeze(['objEng', 'Docs', 'PreMBA', 'Exemption', 'RegForScholarship'])

// 5 nút upload tài liệu ở trang sinh viên. `key` cũng là tên trường trong obj_json.UploadDocument
// (PascalCase, khớp quy ước của obj_json) và nằm trong tên file trên Drive: <MSSV>_<key>.<đuôi>
export const STUDENT_IMPORT_ITEMS = Object.freeze([
  { key: 'CCCD', label: 'National ID (CCCD)', icon: 'mdiCardAccountDetailsOutline' },
  { key: 'EnglishCertificate', label: 'English certificate', icon: 'mdiTranslate' },
  { key: 'UndergradDegree', label: 'Undergraduate degree', icon: 'mdiSchoolOutline' },
  { key: 'Transcript', label: 'Transcript', icon: 'mdiFileDocumentOutline' },
  { key: 'TuitionInvoice', label: 'Tuition invoice', icon: 'mdiReceiptTextOutline' },
])

// Giới hạn file upload (kiểm tra ở trình duyệt để báo sớm, và kiểm tra lại ở server)
export const STUDENT_DOC_MAX_MB = 10
export const STUDENT_DOC_MAX_BYTES = STUDENT_DOC_MAX_MB * 1024 * 1024
// mime -> đuôi file dùng khi đặt lại tên
export const STUDENT_DOC_TYPES = Object.freeze({
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
})
export const STUDENT_DOC_ACCEPT = '.pdf,.jpg,.jpeg,.png'

// FullName nằm trong objProfile như các trường khác và cấu hình như một trường bình thường.
// Tên luôn hiện ở đầu trang sinh viên, nên với FullName chỉ cần chọn Editable hay không.
export const FULL_NAME_KEY = 'FullName'
export const ALWAYS_SHOWN_KEYS = Object.freeze(['FullName'])
export const REQUIRED_KEYS = Object.freeze(['FullName'])

// Cách hiển thị ô nhập của một số trường
export const TEXTAREA_KEYS = Object.freeze(['RegAddress'])
export const SELECT_OPTIONS = Object.freeze({
  Gender: ['Male', 'Female', 'Other'],
})
