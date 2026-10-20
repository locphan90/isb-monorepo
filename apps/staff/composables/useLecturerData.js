// Lớp mỏng gọi repository + transformer; lỗi nghiệp vụ được throw để page hiện snackbar
import {
  fetchActiveLecturers, fetchLecturerById, lecturerEmailExists,
  insertLecturer, updateLecturer
} from '~/data/repositories/lecturerRepository'
import {
  toLecturerOptions, fromLecturerRow, validateLecturerForm,
  toLecturerRow, toLecturerJson, normalizeEmail
} from '~/data/transformers/lecturerTransformer'

export const useLecturerData = () => {
  async function fetchLecturers() {
    return toLecturerOptions(await fetchActiveLecturers())
  }

  async function fetchLecturer(id) {
    return fromLecturerRow(await fetchLecturerById(id))
  }

  // editingId = null -> thêm mới, có giá trị -> cập nhật
  async function saveLecturer(form, editingId, userEmail) {
    const err = validateLecturerForm(form)
    if (err) throw new Error(err)

    if (editingId) {
      await updateLecturer(editingId, toLecturerJson(form), userEmail)
    } else {
      if (await lecturerEmailExists(normalizeEmail(form.Email))) {
        throw new Error('A lecturer with this email already exists.')
      }
      await insertLecturer(toLecturerRow(form, userEmail))
    }
  }

  return { fetchLecturers, fetchLecturer, saveLecturer }
}