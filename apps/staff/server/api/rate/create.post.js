// Thêm Rate. body: { domain, subjectType, rate, validFrom, validThru }. Domain được server xác nhận theo user.
import { RATE_MENU_KEY, RATE_BUTTONS } from '~/data/schemas/rateSchema'
import { validateRateForm, toRatePayload } from '~/data/transformers/rateTransformer'

export default defineEventHandler(async (event) => {
  const { email } = await requireAdminAccess(event, RATE_MENU_KEY, RATE_BUTTONS.SAVE)
  const body = (await readBody(event)) || {}
  const domain = await resolveSubjectDomain(event, email, body.domain)

  const err = validateRateForm(body)
  if (err) throwInvalid(err)

  const rate = await rpcOrThrow(event, 'create_rate', {
    p_domain: domain, p_obj: toRatePayload(body), p_user: email,
  })
  return { rate }
})
