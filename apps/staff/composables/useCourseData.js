// Lớp mỏng gọi repository + transformer; lỗi nghiệp vụ được throw để page hiện snackbar
import {
  fetchSubjectsByDomain, courseNameExists, insertCourse
} from '~/data/repositories/courseRepository'
import {
  toSubjectOptions, validateCourseForm, buildCourseName, toCourseRow
} from '~/data/transformers/courseTransformer'

export const useCourseData = () => {
  async function fetchSubjects(domain) {
    if (!domain) return []
    return toSubjectOptions(await fetchSubjectsByDomain(domain))
  }

  async function createCourse(form, subjName, userEmail) {
    const err = validateCourseForm(form)
    if (err) throw new Error(err)

    const name = buildCourseName(form)
    if (await courseNameExists(name)) throw new Error(`Course ${name} already exists.`)

    await insertCourse(toCourseRow(form, subjName, userEmail))
    return name
  }

  return { fetchSubjects, createCourse }
}