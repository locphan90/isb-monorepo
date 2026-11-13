// Hàm thuần cho form môn học: không đụng Vue / Supabase (dùng cả ở trình duyệt và server)
import {
  SUBJECT_TYPES, SUBJECT_STAGES, SUBJECT_CODE_MAX, SUBJECT_TEXT_MAX, SUBJECT_MAX_FEE_PERIODS, SUBJECT_MAX_AMOUNT,
  FEE_QUARTER_OPTIONS_COUNT, PROGRAMS_BY_DOMAIN,
} from '../schemas/subjectSchema.js'

const str = (v) => String(v ?? '').trim()
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))

// Quý dạng 'YYYYQn' (n = 1..4). So sánh chuỗi cho kết quả đúng thứ tự thời gian
export const isQuarter = (v) => /^\d{4}Q[1-4]$/.test(v)

// 'YYYY-MM-DD' -> 'YYYYQn'
export const quarterOfDate = (d) => `${d.slice(0, 4)}Q${Math.ceil(Number(d.slice(5, 7)) / 3)}`

// Các quý để chọn: từ quý chứa `today` ('YYYY-MM-DD'), đủ `count` quý (mặc định 8 = 2 năm).
// Ví dụ today = tháng 11/2026 -> 2026Q4, 2027Q1, ..., 2028Q3
export const buildQuarterOptions = (today, count = FEE_QUARTER_OPTIONS_COUNT) => {
  let year = Number(today.slice(0, 4))
  let q = Math.ceil(Number(today.slice(5, 7)) / 3)
  const out = []
  for (let i = 0; i < count; i++) {
    out.push(`${year}Q${q}`)
    if (q === 4) { q = 1; year += 1 } else q += 1
  }
  return out
}

// Mã môn đi vào course_name (<mã môn>_Q126_T1) nên không cho khoảng trắng và dấu gạch dưới
const SUBJ_CODE_RE = /^[A-Za-z0-9.-]+$/

// Kiểm tra form thêm môn, trả về chuỗi lỗi (rỗng nếu hợp lệ).
// domain (không bắt buộc): domain đang chọn, để kiểm tra Program là tên program thật chứ không phải tên domain
export const validateSubjectForm = (f, domain) => {
  const code = str(f.subjCode)
  if (!code) return 'Please enter the subject code.'
  if (code.length > SUBJECT_CODE_MAX || !SUBJ_CODE_RE.test(code)) {
    return 'Subject code may only contain letters, digits, "." and "-" (no spaces or underscores).'
  }
  if (!str(f.subjName)) return 'Please enter the subject name.'
  if (str(f.subjName).length > SUBJECT_TEXT_MAX || str(f.code).length > SUBJECT_TEXT_MAX) return 'Text is too long.'
  if (!SUBJECT_TYPES.includes(f.type)) return 'Please select a type.'
  if (!SUBJECT_STAGES.includes(Number(f.stage)) || f.stage === null || f.stage === '') return 'Please select a stage.'
  const prg = str(f.prg)
  if (!prg) return 'Please enter the program.'
  if (prg.length > SUBJECT_CODE_MAX) return 'Program is too long.'
  if (domain) {
    const list = PROGRAMS_BY_DOMAIN[domain] || []
    if (list.length && !list.includes(prg)) return `Program must be one of: ${list.join(', ')}.`
    if (prg.toLowerCase() === String(domain).toLowerCase()) return 'Program must be the program name, not the domain.'
  }
  return ''
}

// Form -> tham số cho tbl_subject: prg/subj_code là cột, còn lại vào obj_json
export const toSubjectPayload = (f) => ({
  prg: str(f.prg),
  subjCode: str(f.subjCode),
  obj: {
    SubjName: str(f.subjName),
    Code: str(f.code),
    Type: f.type,
    Stage: Number(f.stage),
  },
})

const toAmount = (v) => (v === null || v === '' || v === undefined ? NaN : Number(v))

// Kiểm tra danh sách giai đoạn học phí; trả về chuỗi lỗi (rỗng nếu hợp lệ)
export const validateFeePeriods = (periods) => {
  if (!Array.isArray(periods)) return 'Invalid fee list.'
  if (periods.length > SUBJECT_MAX_FEE_PERIODS) return 'Too many fee periods.'
  for (let i = 0; i < periods.length; i++) {
    const p = periods[i] || {}
    const n = i + 1
    for (const [key, label] of [['Fee', 'Fee'], ['RetakeFee', 'Retake Fee']]) {
      const v = toAmount(p[key])
      if (!Number.isFinite(v) || v < 0 || v > SUBJECT_MAX_AMOUNT) return `Period ${n}: ${label} must be a number of 0 or more.`
    }
    const from = str(p.ValidFrom)
    const thru = str(p.ValidThru)
    if (!isQuarter(from)) return `Period ${n}: please select Valid From.`
    if (thru && !isQuarter(thru)) return `Period ${n}: Valid Thru is not a valid quarter.`
    if (thru && thru <= from) return `Period ${n}: Valid Thru must be later than Valid From.`
  }
  // Các giai đoạn không được chồng nhau (quý cuối tính là còn hiệu lực)
  const sorted = normalizeFeePeriods(periods)
  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = sorted[i - 1].ValidThru || '9999Q4' // ValidThru trống = kéo dài vô hạn
    if (sorted[i].ValidFrom <= prevEnd) return 'Fee periods must not overlap.'
  }
  return ''
}

// Chuẩn hóa để lưu: ép kiểu, bỏ khoảng trắng, sắp theo ngày hiệu lực
export const normalizeFeePeriods = (periods = []) =>
  periods
    .map((p) => ({
      Fee: Number(p.Fee) || 0,
      RetakeFee: Number(p.RetakeFee) || 0,
      ValidFrom: str(p.ValidFrom),
      ValidThru: str(p.ValidThru),
    }))
    .sort((a, b) => a.ValidFrom.localeCompare(b.ValidFrom))

// Giá trị cũ dạng ngày 'YYYY-MM-DD' (bản trước khi chuyển sang quý) được đổi sang quý khi mở form
const toQuarterValue = (v) => (isDate(str(v)) ? quarterOfDate(str(v)) : str(v))

// arr_json từ DB -> dữ liệu form (dữ liệu cũ không phải mảng thì coi như chưa có giai đoạn nào)
export const toFeeForm = (arr) =>
  Array.isArray(arr)
    ? arr.map((p) => ({
        Fee: p?.Fee ?? null,
        RetakeFee: p?.RetakeFee ?? null,
        ValidFrom: toQuarterValue(p?.ValidFrom),
        ValidThru: toQuarterValue(p?.ValidThru),
      }))
    : []

// Dòng từ server -> dòng hiển thị trong danh sách
export const toSubjectRow = (r) => ({
  id: r.id,
  subjCode: r.subjCode,
  subjName: r.objJson?.SubjName || '',
  code: r.objJson?.Code || '',
  type: r.objJson?.Type || '',
  stage: r.objJson?.Stage ?? '',
  prg: r.prg || '',
  fees: toFeeForm(r.arrJson),
})

export const formatAmount = (v) => (Number.isFinite(Number(v)) ? Number(v).toLocaleString('en-US') : '')

// Giai đoạn đang hiệu lực ở quý chứa hôm nay (today = 'YYYY-MM-DD'), dùng để hiện nhanh học phí trong danh sách
export const currentFeePeriod = (fees, today) => {
  const q = quarterOfDate(today)
  return toFeeForm(fees)
    .filter((p) => isQuarter(p.ValidFrom))
    .sort((a, b) => a.ValidFrom.localeCompare(b.ValidFrom))
    .find((p) => p.ValidFrom <= q && (!p.ValidThru || p.ValidThru >= q)) || null
}

const ERROR_MESSAGES = {
  SUBJECT_DUPLICATED: 'This subject code already exists for this program.',
  SUBJECT_NOT_FOUND: 'Subject not found. It may have been deleted. Please reload.',
  DOMAIN_NOT_ALLOWED: 'You do not have access to this domain.',
  FORBIDDEN: 'You do not have permission to do this.',
  INVALID_BODY: 'Invalid data.',
  INVALID_VALUE: 'Invalid data.',
}

export const subjectErrorMessage = (e) => {
  const text = [e?.data?.statusMessage, e?.statusMessage, e?.message].filter(Boolean).join(' | ')
  const code = Object.keys(ERROR_MESSAGES).find((c) => text.includes(c))
  if (code) return ERROR_MESSAGES[code]
  // Lỗi kiểm tra do server trả về kèm câu tiếng Anh cụ thể
  if (e?.data?.statusMessage && e.data.statusMessage.startsWith('INVALID:')) return e.data.statusMessage.slice(8).trim()
  return 'Something went wrong. Please try again.'
}
