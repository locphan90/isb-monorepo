// Tạo khóa học. body: { domain, subjCode, prg, quarter, coef, lecturers }
// - Quyền: menu Create Course. Domain do server xác nhận theo user (không tin domain client gửi).
// - Tên khóa dựng theo quy tắc của domain (courseRules.js); số thứ tự và kiểm tra trùng do hàm SQL create_course làm trong một giao dịch.
// - Lớp = ký tự đầu của program của môn + số thứ tự; Rate do DB tra theo loại môn của môn học và quý (client không gửi Rate).
// - start_date / end_date = ngày đầu / ngày cuối của quý (form không còn nhập ngày).
import { COURSE_MENU_KEY } from '~/data/schemas/courseSchema'
import { validateCoursePayload, courseNamePlan, quarterRange } from '~/data/transformers/courseRules'

export default defineEventHandler(async (event) => {
  const { email } = await requireAdminAccess(event, COURSE_MENU_KEY)
  const body = (await readBody(event)) || {}
  const domain = await resolveSubjectDomain(event, email, body.domain)

  const input = { ...body, domain }
  const err = validateCoursePayload(input)
  if (err) throwInvalid(err)

  const plan = courseNamePlan(input)
  const { start, end } = quarterRange(String(body.quarter).trim())

  const course = await rpcOrThrow(event, 'create_course', {
    p_domain: domain,
    p_prg: String(body.prg).trim(),
    p_subj_code: String(body.subjCode).trim(),
    p_quarter: String(body.quarter).trim(),
    p_name: plan.name,
    p_numbered: plan.numbered,
    p_coef: Number(body.coef),
    p_start: start,
    p_end: end,
    p_lecturers: (body.lecturers ?? []).map((l) => ({
      email: String(l.email).trim(),
      name: String(l.name).trim(),
      role: l.role,
      cost_up: Number(l.cost_up),
      cost_qty: Number(l.cost_qty),
      noofsection: Number(l.noofsection),
    })),
    p_user: email,
  })
  return { course }
})
