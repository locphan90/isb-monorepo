// Danh sách "môn cần phải học" (System > Required Subjects) nằm trong MỘT dòng tbl_misc:
//   cat = 'SUBJECTS', val = 'REQUIRED_LIST', arr_json = { subjects: [{ code, name, prg, major, domain }] }
// Chứa môn của MỌI domain; mỗi domain chỉ được sửa phần của mình (server gộp lại, không tin client gửi domain khác).
import { PROGRAMS_BY_DOMAIN, REQUIRED_SUBJECTS_MAX, REQUIRED_SUBJECT_TEXT_MAX } from '~/data/schemas/subjectSchema'

const TABLE = 'tbl_misc'
const CAT = 'SUBJECTS'
const VAL = 'REQUIRED_LIST'
const SHORT_MAX = 20

// Đọc dòng cấu hình; { id, subjects } (id null nếu chưa có dòng)
export const loadRequiredSubjectsRow = async (event) => {
  const { data, error } = await useSupabaseAdmin(event)
    .from(TABLE)
    .select('id, arr_json')
    .eq('cat', CAT)
    .eq('val', VAL)
    .maybeSingle()
  if (error) {
    console.error('[required-subjects] read failed:', error.message)
    throw createError({ statusCode: 500, statusMessage: 'DB_ERROR' })
  }
  const subjects = Array.isArray(data?.arr_json?.subjects) ? data.arr_json.subjects : []
  return { id: data?.id ?? null, subjects }
}

// body.subjects (từ trình duyệt) -> [{ code, name, prg, major }] đã làm sạch. Sai dữ liệu -> 400 kèm câu cụ thể.
export const parseRequiredSubjects = (raw, domain) => {
  if (!Array.isArray(raw)) throwInvalid('Invalid data.')
  if (raw.length > REQUIRED_SUBJECTS_MAX) throwInvalid(`Too many subjects (max ${REQUIRED_SUBJECTS_MAX}).`)

  const allowedPrg = PROGRAMS_BY_DOMAIN[String(domain).toUpperCase()] // domain khác (vd ISP) chưa quy định: cho nhập tự do
  return raw.map((s) => {
    const code = String(s?.code ?? '').trim()
    const name = String(s?.name ?? '').trim()
    const prg = String(s?.prg ?? '').trim()
    const major = String(s?.major ?? '').trim()
    if (!code || !name) throwInvalid('Every subject needs a code and a name.')
    if (code.length > REQUIRED_SUBJECT_TEXT_MAX || name.length > REQUIRED_SUBJECT_TEXT_MAX) throwInvalid('A subject code or name is too long.')
    if (!prg || !major || prg.length > SHORT_MAX || major.length > SHORT_MAX) throwInvalid('Please select PRG and Major for every subject.')
    if (allowedPrg && !allowedPrg.includes(prg)) throwInvalid('Please select PRG and Major for every subject.')
    return { code, name, prg, major }
  })
}

// Giữ nguyên môn của domain khác; môn của domain này (và môn cũ chưa gán domain) được thay bằng danh sách mới
export const mergeRequiredSubjects = (latest, incoming, domain) => [
  ...latest.filter((s) => s?.domain && s.domain !== domain),
  ...incoming.map((s) => ({ ...s, domain })),
]

export const saveRequiredSubjectsRow = async (event, id, subjects) => {
  const db = useSupabaseAdmin(event).from(TABLE)
  const { error } = id
    ? await db.update({ arr_json: { subjects } }).eq('id', id)
    : await db.insert({ cat: CAT, val: VAL, arr_json: { subjects }, i_status: 0 })
  if (error) {
    console.error('[required-subjects] save failed:', error.message)
    throw createError({ statusCode: 500, statusMessage: 'DB_ERROR' })
  }
}
