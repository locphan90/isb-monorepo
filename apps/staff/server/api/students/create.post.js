// Tạo sinh viên. body: { mssv, objJson, domain }. Cần quyền menu Add Student.
// Domain xác nhận theo user (không tin trình duyệt); objJson chỉ giữ các trường có trong schema, đúng kiểu.
import { STUDENT_GROUP_KEYS, sanitizeStudentPatch, isValidMssv } from '~/data/transformers/studentJson'

export default defineEventHandler(async (event) => {
  const { email } = await requireAdminAccess(event, STUDENT_ADD_MENU_KEY)
  const body = (await readBody(event)) || {}
  const domain = await resolveSubjectDomain(event, email, body.domain)

  const mssv = String(body.mssv ?? '').trim()
  if (!isValidMssv(mssv)) throwInvalid('MSSV may only contain letters, digits, "." "_" and "-" (max 40 characters).')

  const obj = sanitizeOrThrow(() => sanitizeStudentPatch(body.objJson ?? {}, STUDENT_GROUP_KEYS))
  const student = await rpcOrThrow(event, 'create_student', { p_mssv: mssv, p_obj: obj, p_domain: domain })
  return { student }
})
