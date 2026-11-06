// Xóa mềm Rate. body: { domain, id }
import { RATE_MENU_KEY, RATE_BUTTONS } from '~/data/schemas/rateSchema'

export default defineEventHandler(async (event) => {
  const { email } = await requireAdminAccess(event, RATE_MENU_KEY, RATE_BUTTONS.DELETE)
  const body = (await readBody(event)) || {}
  const domain = await resolveSubjectDomain(event, email, body.domain)
  await rpcOrThrow(event, 'delete_rate', { p_domain: domain, p_id: parseSubjectId(body.id), p_user: email })
  return { ok: true }
})
