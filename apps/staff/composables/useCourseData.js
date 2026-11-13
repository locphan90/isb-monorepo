// Lớp mỏng gọi repository + transformer; lỗi nghiệp vụ được throw để page hiện snackbar
import {
  fetchSubjectsByDomain, fetchCourseNamesByPrefix, fetchCourseRate, fetchCoursePics, createCourseViaApi,
  fetchCourseListViaApi, updateCourseViaApi
} from '~/data/repositories/courseRepository'
import {
  toSubjectOptions, validateCourseForm, toCreateCoursePayload, courseErrorMessage,
  toUpdateCoursePayload, validateCourseEditForm
} from '~/data/transformers/courseTransformer'

export const useCourseData = () => {
  async function fetchSubjects(domain) {
    if (!domain) return []
    try {
      return toSubjectOptions(await fetchSubjectsByDomain(domain), domain)
    } catch (e) {
      const err = new Error(courseErrorMessage(e))
      err.unauthorized = e?.statusCode === 401 || e?.status === 401
      throw err
    }
  }

  // Tên khóa đang dùng theo tiền tố, để xem trước số thứ tự (lỗi đọc không chặn việc tạo khóa)
  async function fetchCourseNames(prefix) {
    try {
      return await fetchCourseNamesByPrefix(prefix)
    } catch {
      return []
    }
  }

  // Rate hiệu lực của môn tại một quý ({ subjectType, rate }); lỗi trả { error: true } để page hiện cảnh báo
  async function fetchRate(domain, subject, quarter) {
    try {
      return await fetchCourseRate({ domain, prg: subject.prg, subjCode: subject.value, quarter })
    } catch {
      return { error: true }
    }
  }

  // Email PIC của domain để đổ vào ô PIC; lỗi được throw để page hiện snackbar
  async function fetchPics(domain) {
    if (!domain) return []
    return await fetchCoursePics(domain)
  }

  // subject: item của ô chọn môn ({ value, prg, ... }); trả về { courseName, rate, pic, picSaved } (tên và rate do DB cấp / tra)
  async function createCourse(form, subject, domain) {
    const payload = toCreateCoursePayload(form, subject, domain)
    const err = validateCourseForm(payload)
    if (err) throw new Error(err)
    try {
      const res = await createCourseViaApi(payload)
      return res.course
    } catch (e) {
      throw new Error(courseErrorMessage(e))
    }
  }

  // Danh sách khóa của domain: mặc định khóa chưa kết thúc, includePast = true thì thêm khóa đã kết thúc
  async function fetchCourses(domain, includePast = false) {
    if (!domain) return []
    try {
      const res = await fetchCourseListViaApi(domain, includePast)
      return res?.courses || []
    } catch (e) {
      throw new Error(courseErrorMessage(e))
    }
  }

  // Sửa khóa: chỉ hệ số, PIC, giảng viên. form: { coef, pic, lecturers }; trả về khóa sau khi sửa
  async function updateCourse(id, form, domain) {
    const payload = toUpdateCoursePayload(id, form, domain)
    const err = validateCourseEditForm(payload)
    if (err) throw new Error(err)
    try {
      const res = await updateCourseViaApi(payload)
      return res.course
    } catch (e) {
      throw new Error(courseErrorMessage(e))
    }
  }

  return { fetchSubjects, fetchCourseNames, fetchRate, fetchPics, createCourse, fetchCourses, updateCourse }
}
