// Hàm thuần cho form Rate: không đụng Vue / Supabase (dùng cả ở trình duyệt và server)
import { RATE_SUBJECT_TYPES, RATE_MAX_AMOUNT } from '../schemas/rateSchema.js'
import { isQuarter, quarterOfDate } from './subjectTransformer.js'

const str = (v) => String(v ?? '').trim()
const END = '9999Q4' // ValidThru trống = kéo dài vô hạn

// Kiểm tra form, trả về chuỗi lỗi (rỗng nếu hợp lệ)
export const validateRateForm = (f) => {
  if (!RATE_SUBJECT_TYPES.includes(f.subjectType)) return 'Please select a subject type.'
  const rate = f.rate === null || f.rate === '' || f.rate === undefined ? NaN : Number(f.rate)
  if (!Number.isFinite(rate) || rate < 0 || rate > RATE_MAX_AMOUNT) return 'Rate must be a number of 0 or more.'
  const from = str(f.validFrom)
  const thru = str(f.validThru)
  if (!isQuarter(from)) return 'Please select Valid From.'
  if (thru && !isQuarter(thru)) return 'Valid Thru is not a valid quarter.'
  if (thru && thru <= from) return 'Valid Thru must be later than Valid From.'
  return ''
}

// Form -> tham số gửi lên (Domain do server gắn theo user, không lấy từ form)
export const toRatePayload = (f) => ({
  SubjectType: f.subjectType,
  Rate: Number(f.rate),
  ValidFrom: str(f.validFrom),
  ValidThru: str(f.validThru),
})

// Dòng từ server -> dòng hiển thị
export const toRateRow = (r) => ({
  id: r.id,
  domain: r.objJson?.Domain || '',
  subjectType: r.objJson?.SubjectType || '',
  rate: r.objJson?.Rate ?? null,
  validFrom: r.objJson?.ValidFrom || '',
  validThru: r.objJson?.ValidThru || '',
})

// Giai đoạn mới có chồng giai đoạn nào đã có (cùng loại môn) không; trả về dòng bị chồng hoặc null
export const findRateOverlap = (rows, candidate) => {
  const from = str(candidate.validFrom ?? candidate.ValidFrom)
  const thru = str(candidate.validThru ?? candidate.ValidThru) || END
  const type = candidate.subjectType ?? candidate.SubjectType
  return (
    rows.find((r) => r.subjectType === type && r.validFrom <= thru && from <= (r.validThru || END)) || null
  )
}

// Trạng thái so với quý chứa hôm nay (today = 'YYYY-MM-DD')
export const rateStatus = (row, today) => {
  const q = quarterOfDate(today)
  if (row.validFrom > q) return 'Upcoming'
  if (row.validThru && row.validThru < q) return 'Expired'
  return 'Current'
}

export { formatAmount } from './subjectTransformer.js'

const ERROR_MESSAGES = {
  RATE_DUPLICATED: 'A rate for this subject type starting in this quarter already exists.',
  RATE_OVERLAP: 'This period overlaps an existing rate of the same subject type.',
  RATE_NOT_FOUND: 'Rate not found. It may have been deleted. Please reload.',
  DOMAIN_NOT_ALLOWED: 'You do not have access to this domain.',
  FORBIDDEN: 'You do not have permission to do this.',
  INVALID_BODY: 'Invalid data.',
  INVALID_VALUE: 'Invalid data.',
}

export const rateErrorMessage = (e) => {
  const text = [e?.data?.statusMessage, e?.statusMessage, e?.message].filter(Boolean).join(' | ')
  const code = Object.keys(ERROR_MESSAGES).find((c) => text.includes(c))
  if (code) return ERROR_MESSAGES[code]
  if (e?.data?.statusMessage && e.data.statusMessage.startsWith('INVALID:')) return e.data.statusMessage.slice(8).trim()
  return 'Something went wrong. Please try again.'
}
