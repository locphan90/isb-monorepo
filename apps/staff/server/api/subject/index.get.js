// Danh sách môn học của domain đang chọn (?domain=...). Cần quyền menu Subjects.
import { SUBJECT_MENU_KEY } from '~/data/schemas/subjectSchema'

export default defineEventHandler(async (event) => {
  const { email } = await requireAdminAccess(event, SUBJECT_MENU_KEY)
  const domain = await resolveSubjectDomain(event, email, getQuery(event).domain)
  const subjects = await rpcOrThrow(event, 'list_subjects', { p_domain: domain })
  return { domain, subjects: subjects ?? [] }
})
