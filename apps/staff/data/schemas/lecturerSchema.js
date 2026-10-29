// Khai báo hồ sơ giảng viên (chỉ khai báo, không có logic). Bảng: tbl_lecturer (xem sql/20261028_lecturer_table.sql)
// File này dùng cả ở trình duyệt lẫn server nên không import gì từ Vue/Nuxt.
//
// Cách chia dữ liệu:
//   - Trường hay truy vấn / lọc / sắp xếp / kiểm tra ràng buộc -> CỘT thật của bảng (LECTURER_COLUMN_FIELDS)
//   - Trường chỉ để xem / in / tính lương, ít khi lọc                -> gói trong cột obj_json (LECTURER_JSON_FIELDS)
// Muốn chuyển một trường giữa hai nhóm: sửa hai danh sách dưới đây + file SQL (cột) + hàm save_lecturer.

export const LECTURER_MENU_KEY = 'academic-lecturer-profile' // khớp key trong config/menu.js
export const LECTURER_STATUS = { ACTIVE: 0, DELETED: 1 }

export const DEGREES = ['Doctor', 'Master', 'Phd candidate', 'PostGrad', 'Bachelor']
export const PIT_RATES = [10, 15, 20, 25, 30, 3]
export const LECTURER_TYPES = ['Khoan viec', 'BTG-WSU MBA', 'BTG-Others', 'Co huu']
// Chưa có danh sách chính thức, chỉnh tại đây khi có
export const PAYMENT_TERMS = ['Monthly', 'Quarterly', 'Per course']
export const SOCIAL_INSURANCE = ['Yes', 'No']

// Tên trường trong form (PascalCase) -> tên cột trong tbl_lecturer
export const LECTURER_COLUMN_FIELDS = {
  FullName: 'full_name',
  Email: 'email',
  Type: 'type',
  HighestDegree: 'highest_degree',
  ContractStart: 'contract_start',
  ContractEnd: 'contract_end'
}

// Các trường nằm trong obj_json (server chỉ nhận đúng các khóa này, khóa lạ bị bỏ)
export const LECTURER_JSON_FIELDS = [
  'DOB', 'PhoneNo', 'IDNo', 'DOI', 'Nationality', 'Major',
  'TaxNo', 'PITRate', 'BankAccount', 'BankName',
  'ContractNo', 'PaymentTerm', 'SocialInsurance'
]

// Trường kiểu ngày ('YYYY-MM-DD')
export const LECTURER_DATE_FIELDS = ['DOB', 'DOI', 'ContractStart', 'ContractEnd']

// Giới hạn độ dài chuỗi (server kiểm tra lại)
export const LECTURER_TEXT_MAX = 200

export const emptyLecturerProfile = () => ({
  FullName: '',
  DOB: null,
  PhoneNo: '',
  IDNo: '',
  DOI: null,
  Email: '',
  Nationality: '',
  HighestDegree: null,
  Major: '',
  TaxNo: '',
  PITRate: null,
  BankAccount: '',
  BankName: '',
  ContractNo: '',
  ContractStart: null,
  ContractEnd: null,
  Type: null,
  PaymentTerm: null,
  SocialInsurance: null
})
