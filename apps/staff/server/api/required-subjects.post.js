// Lưu danh sách môn cần học của MỘT domain. body: { domain, subjects: [{ code, name, prg, major }] }  =>  { subjects: [...tất cả domain] }
// Quyền: menu Required Subjects. Domain do server xác nhận theo user; môn của domain khác được giữ nguyên.
import { REQUIRED_SUBJECTS_MENU_KEY } from '~/data/schemas/subjectSchema'

export default defineEventHandler(async (event) => {
  const { email } = await requireAdminAccess(event, REQUIRED_SUBJECTS_MENU_KEY)
  const body = await readBody(event)
  const domain = await resolveSubjectDomain(event, email, body?.domain)
  const incoming = parseRequiredSubjects(body?.subjects, domain)

  // Đọc bản mới nhất rồi gộp để không ghi đè môn của domain khác
  const { id, subjects: latest } = await loadRequiredSubjectsRow(event)
  const merged = mergeRequiredSubjects(latest, incoming, domain)
  await saveRequiredSubjectsRow(event, id, merged)
  return { subjects: merged }
})
