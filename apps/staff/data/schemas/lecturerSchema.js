// Khai báo hồ sơ giảng viên, lưu trong tbl_misc với cat = 'LECTURER'
// Quy ước tbl_misc: id, cat, val (= email, là khóa), obj_json, arr_json, i_status, last_user

export const LECTURER_CAT = 'LECTURER'
export const LECTURER_STATUS = { ACTIVE: 0, DELETED: 1 }

export const DEGREES = ['Doctor', 'Master', 'Phd candidate', 'PostGrad', 'Bachelor']
export const PIT_RATES = [10, 15, 20, 25, 30, 3]
export const LECTURER_TYPES = ['Khoan viec', 'BTG-WSU MBA', 'BTG-Others', 'Co huu']
// Chưa có danh sách chính thức, chỉnh tại đây khi có
export const PAYMENT_TERMS = ['Monthly', 'Quarterly', 'Per course']
export const SOCIAL_INSURANCE = ['Yes', 'No']

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