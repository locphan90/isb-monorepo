// Xóa mềm môn học. body: { domain, id }
import { SUBJECT_MENU_KEY, SUBJECT_BUTTONS } from '~/data/schemas/subjectSchema'

export default defineEventHandler(async (event) => {
  const { email } = await requireAdminAccess(event, SUBJECT_MENU_KEY, SUBJECT_BUTTONS.DELETE)
  const body = (await readBody(event)) || {}
  const domain = await resolveSubjectDomain(event, email, body.domain)
  await rpcOrThrow(event, 'delete_subject', { p_domain: domain, p_id: parseSubjectId(body.id) })
  return { ok: true }
})
