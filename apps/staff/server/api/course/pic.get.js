// Danh sách PIC của domain cho ô PIC ở form Create Course.
// ?domain=MBA  =>  { domain, emails: [...] }  (emails rỗng nếu domain chưa khai PIC trong tbl_misc)
// Quyền: menu Create Course. Domain do server xác nhận theo user (không tin domain client gửi).
import { COURSE_MENU_KEY } from '~/data/schemas/courseSchema'

export default defineEventHandler(async (event) => {
  const { email } = await requireAdminAccess(event, COURSE_MENU_KEY)
  const domain = await resolveSubjectDomain(event, email, getQuery(event).domain)
  return { domain, emails: await loadPicEmails(event, domain) }
})
