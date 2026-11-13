// Sửa khóa học. body: { id, domain, coef, pic, lecturers }
// - Chỉ sửa được hệ số (coef), PIC và giảng viên. Tên khóa, môn, quý / ngày và Rate giữ nguyên: tên khóa là khóa nối với lịch học
//   và đăng ký của sinh viên, Rate là giá trị đã chụp lúc tạo khóa.
// - Quyền: menu Create Course + nút `edit`. Khóa phải còn dùng và thuộc domain của user (domain do server xác nhận).
// - PIC phải nằm trong danh sách PIC của domain (hoặc giữ nguyên giá trị đang có); '' = bỏ PIC.
// - Giảng viên: email phải là giảng viên đang hoạt động (hoặc đã có sẵn trong khóa); tên lấy từ DB, không lấy từ client.
import { COURSE_MENU_KEY, COURSE_BUTTONS } from '~/data/schemas/courseSchema'
import { validateCourseUpdate } from '~/data/transformers/courseRules'

export default defineEventHandler(async (event) => {
  const { email } = await requireAdminAccess(event, COURSE_MENU_KEY, COURSE_BUTTONS.EDIT)
  const body = (await readBody(event)) || {}
  const id = parseCourseId(body.id)
  const domain = await resolveSubjectDomain(event, email, body.domain)

  const err = validateCourseUpdate(body)
  if (err) throwInvalid(err)

  const admin = useSupabaseAdmin(event)
  const { data: found, error: findError } = await admin
    .from('tbl_course')
    .select(COURSE_LIST_COLUMNS)
    .eq('id', id)
    .eq('i_status', 0)
    .limit(1)
  if (findError) {
    console.error('[course] find failed:', findError.message)
    throw createError({ statusCode: 500, statusMessage: 'DB_ERROR' })
  }
  const current = found?.[0]
  if (!current) throw createError({ statusCode: 404, statusMessage: 'COURSE_NOT_FOUND' })
  await assertCourseInDomain(event, { courseName: current.course_name }, [domain])

  const pic = String(body.pic ?? '').trim().toLowerCase()
  if (pic && pic !== String(current.pic || '').trim().toLowerCase() && !(await loadPicEmails(event, domain)).includes(pic)) {
    throwInvalid('The selected PIC is not valid for this domain.')
  }

  const keepNames = new Map(courseLecturersOf(current).map((l) => [l.email, l.name]))
  const lecturers = await normalizeCourseLecturers(event, body.lecturers, keepNames)

  const { data: saved, error } = await admin
    .from('tbl_course')
    .update({ coef: Number(body.coef), pic: pic || null, obj_lecturer: lecturers, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('i_status', 0)
    .select(COURSE_LIST_COLUMNS)
    .limit(1)
  if (error) {
    console.error('[course] update failed:', error.message)
    throw createError({ statusCode: 500, statusMessage: 'DB_ERROR' })
  }
  if (!saved?.[0]) throw createError({ statusCode: 404, statusMessage: 'COURSE_NOT_FOUND' })
  return { course: toCourseRow(saved[0], todayVN()) }
})
