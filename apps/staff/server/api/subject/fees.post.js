// Lưu các giai đoạn học phí của một môn (thay toàn bộ arr_json). body: { domain, id, fees: [{ Fee, RetakeFee, ValidFrom, ValidThru }] }
import { SUBJECT_MENU_KEY, SUBJECT_BUTTONS } from '~/data/schemas/subjectSchema'
import { validateFeePeriods, normalizeFeePeriods } from '~/data/transformers/subjectTransformer'

export default defineEventHandler(async (event) => {
  const { email } = await requireAdminAccess(event, SUBJECT_MENU_KEY, SUBJECT_BUTTONS.FEES)
  const body = (await readBody(event)) || {}
  const domain = await resolveSubjectDomain(event, email, body.domain)

  const err = validateFeePeriods(body.fees)
  if (err) throwInvalid(err)

  const fees = await rpcOrThrow(event, 'save_subject_fees', {
    p_domain: domain,
    p_id: parseSubjectId(body.id),
    p_fees: normalizeFeePeriods(body.fees),
  })
  return { fees }
})
