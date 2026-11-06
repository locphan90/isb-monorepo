// Lớp mỏng gọi repository + transformer; lỗi nghiệp vụ được throw để page hiện snackbar
import {
  fetchSubjectsByDomain, fetchCourseNamesByPrefix, fetchCourseRate, createCourseViaApi
} from '~/data/repositories/courseRepository'
import {
  toSubjectOptions, validateCourseForm, toCreateCoursePayload, courseErrorMessage
} from '~/data/transformers/courseTransformer'

export const useCourseData = () => {
  async function fetchSubjects(domain) {
    if (!domain) return []
    return toSubjectOptions(await fetchSubjectsByDomain(domain))
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

  // subject: item của ô chọn môn ({ value, prg, ... }); trả về { courseName, rate } do DB cấp / tra
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

  return { fetchSubjects, fetchCourseNames, fetchRate, createCourse }
}
