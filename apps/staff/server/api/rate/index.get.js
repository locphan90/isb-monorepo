// Danh sách Rate của domain đang chọn (?domain=...). Cần quyền menu Rates.
import { RATE_MENU_KEY } from '~/data/schemas/rateSchema'

export default defineEventHandler(async (event) => {
  const { email } = await requireAdminAccess(event, RATE_MENU_KEY)
  const domain = await resolveSubjectDomain(event, email, getQuery(event).domain)
  const rates = await rpcOrThrow(event, 'list_rates', { p_domain: domain })
  return { domain, rates: rates ?? [] }
})
