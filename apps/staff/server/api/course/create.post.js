// Tạo khóa học. body: { domain, subjCode, prg, program, className, quarter, coef, lecturers }
// - Quyền: menu Create Course. Domain do server xác nhận theo user (không tin domain client gửi).
// - Tên khóa dựng theo quy tắc của domain (courseRules.js); số thứ tự và kiểm tra trùng do hàm SQL create_course làm trong một giao dịch.
// - Tên lớp theo quy tắc của domain (courseRules.js): domain đặt tên theo program = ký tự đầu của program + số thứ tự (DB cấp); domain nhập tay (vd WSU) dùng className.
// - prg = cột prg của môn (tìm môn trong tbl_subject); program = program dùng đặt tên. Rate do DB tra theo loại môn của môn học và quý (client không gửi Rate).
// - start_date / end_date = ngày đầu / ngày cuối của quý (form không còn nhập ngày).
// - PIC (không bắt buộc): phải nằm trong danh sách PIC của domain (tbl_misc cat = 'PIC'); lưu vào cột tbl_course.pic sau khi tạo khóa
//   (create_course không đổi). Nếu bước lưu PIC lỗi thì khóa vẫn được tạo, kết quả trả picSaved = false để client cảnh báo.
// - Giảng viên: email phải thuộc giảng viên đang hoạt động trong tbl_lecturer; tên lưu vào khóa lấy từ DB, không lấy từ client.
import { COURSE_MENU_KEY } from '~/data/schemas/courseSchema'
import { validateCoursePayload, courseNamePlan, quarterRange } from '~/data/transformers/courseRules'

export default defineEventHandler(async (event) => {
  const { email } = await requireAdminAccess(event, COURSE_MENU_KEY)
  const body = (await readBody(event)) || {}
  const domain = await resolveSubjectDomain(event, email, body.domain)

  const input = { ...body, domain }
  const err = validateCoursePayload(input)
  if (err) throwInvalid(err)

  // PIC chọn từ danh sách của domain: kiểm tra lại ở server, không tin client
  const pic = String(body.pic ?? '').trim().toLowerCase()
  if (pic && !(await loadPicEmails(event, domain)).includes(pic)) throwInvalid('The selected PIC is not valid for this domain.')

  const plan = courseNamePlan(input)
  const { start, end } = quarterRange(String(body.quarter).trim())

  // Giảng viên chọn từ danh sách tbl_lecturer: kiểm tra lại ở server và dùng tên chuẩn trong DB
  const lecturers = await normalizeCourseLecturers(event, body.lecturers)

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
    p_lecturers: lecturers,
    p_user: email,
  })

  // Lưu PIC vào khóa vừa tạo (hàm SQL create_course không nhận PIC). Lỗi ở bước này không làm mất khóa đã tạo
  let picSaved = true
  if (pic) {
    const { error } = course?.id
      ? await useSupabaseAdmin(event).from('tbl_course').update({ pic }).eq('id', course.id)
      : { error: { message: 'create_course did not return the course id' } }
    if (error) {
      console.error('[course] save PIC failed:', error.message)
      picSaved = false
    }
  }
  return { course: { ...course, pic: picSaved && pic ? pic : null, picSaved } }
})
