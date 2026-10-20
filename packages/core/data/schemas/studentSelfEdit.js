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

// 5 nút import ở trang sinh viên (chưa có chức năng, nối sau)
export const STUDENT_IMPORT_ITEMS = Object.freeze([
  { key: 'national-id', label: 'National ID (CCCD)', icon: 'mdiCardAccountDetailsOutline' },
  { key: 'english-certificate', label: 'English certificate', icon: 'mdiTranslate' },
  { key: 'undergrad-degree', label: 'Undergraduate degree', icon: 'mdiSchoolOutline' },
  { key: 'transcript', label: 'Transcript', icon: 'mdiFileDocumentOutline' },
  { key: 'tuition-invoice', label: 'Tuition invoice', icon: 'mdiReceiptTextOutline' },
])

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
