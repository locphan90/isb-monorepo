// Lớp mỏng gọi repository + transformer; lỗi được đổi thành Error có câu thông báo để page hiện snackbar
import { lecturerRepository as repo } from '~/data/repositories/lecturerRepository'
import {
  toLecturerOptions, fromLecturerRow, validateLecturerForm, toLecturerPayload, lecturerErrorMessage
} from '~/data/transformers/lecturerTransformer'

export const useLecturerData = () => {
  const wrap = async (fn) => {
    try {
      return await fn()
    } catch (e) {
      throw new Error(lecturerErrorMessage(e))
    }
  }

  async function fetchLecturers() {
    return toLecturerOptions(await wrap(() => repo.list()))
  }

  async function fetchLecturer(id) {
    return fromLecturerRow(await wrap(() => repo.get(id)))
  }

  // editingId = null -> thêm mới, có giá trị -> cập nhật. Người thao tác lấy từ session ở server.
  async function saveLecturer(form, editingId) {
    const err = validateLecturerForm(form)
    if (err) throw new Error(err)
    return await wrap(() => repo.save({ ...toLecturerPayload(form), ...(editingId ? { id: editingId } : {}) }))
  }

  return { fetchLecturers, fetchLecturer, saveLecturer }
}
