import { fetchRequiredSubjects, saveRequiredSubjects } from '~/data/repositories/subjectRepository.js'

// Tất cả môn của MỌI domain: [{ code, name, prg, major, domain }]
const subjects = ref([])
let loaded = false

export function useRequiredSubjects() {
  async function loadSubjects(force = false) {
    if (loaded && !force) return subjects.value
    subjects.value = await fetchRequiredSubjects()
    loaded = true
    return subjects.value
  }

  // Môn của 1 domain — dùng ở form Add/Edit sinh viên để vẽ checkbox
  // (môn cũ chưa có domain KHÔNG được trả về ở đây)
  function getSubjectsByDomain(domain) {
    return subjects.value.filter((s) => s.domain === domain)
  }

  // Môn để hiển thị trong trang System > Required Subjects: môn của domain
  // hiện tại + môn cũ chưa gán domain (người lưu đầu tiên sẽ "nhận" các môn này)
  function getEditableSubjects(domain) {
    return subjects.value.filter((s) => !s.domain || s.domain === domain)
  }

  // Lưu danh sách môn của 1 domain. Toàn bộ môn nằm chung 1 dòng trong
  // tbl_misc; server đọc bản mới nhất rồi giữ nguyên môn của domain khác
  // (không ghi đè dữ liệu của họ) và trả về danh sách đã gộp.
  async function saveSubjects(list, domain) {
    subjects.value = await saveRequiredSubjects(list, domain)
    loaded = true
  }

  return { subjects, loadSubjects, getSubjectsByDomain, getEditableSubjects, saveSubjects }
}