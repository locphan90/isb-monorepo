// Rate hiệu lực của một môn tại một quý, cho form Create Course xem trước.
// ?domain=&prg=&subjCode=&quarter=2026Q4  =>  { subjectType, rate }  (rate null nếu chưa có Rate cho loại môn đó ở quý đó)
// Quyền: menu Create Course (không cần quyền menu Rates). Loại môn lấy từ tbl_subject ở DB, không tin client.
import { COURSE_MENU_KEY } from '~/data/schemas/courseSchema'
import { isQuarter } from '~/data/transformers/subjectTransformer'

export default defineEventHandler(async (event) => {
  const { email } = await requireAdminAccess(event, COURSE_MENU_KEY)
  const q = getQuery(event)
  const domain = await resolveSubjectDomain(event, email, q.domain)

  const prg = String(q.prg || '').trim()
  const subjCode = String(q.subjCode || '').trim()
  const quarter = String(q.quarter || '').trim()
  if (!prg || !subjCode || !isQuarter(quarter)) throwInvalid('Please select a subject and a quarter.')

  return await rpcOrThrow(event, 'get_course_rate', {
    p_domain: domain, p_prg: prg, p_subj_code: subjCode, p_quarter: quarter,
  })
})
