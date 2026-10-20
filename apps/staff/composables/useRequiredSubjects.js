import { fetchRequiredSubjects, saveRequiredSubjects } from '~/data/repositories/subjectRepository.js'

const subjects = ref([]) // [{ code, name }]
let loaded = false

export function useRequiredSubjects() {
  async function loadSubjects(force = false) {
    if (loaded && !force) return subjects.value
    subjects.value = await fetchRequiredSubjects()
    loaded = true
    return subjects.value
  }

  async function saveSubjects(list) {
    await saveRequiredSubjects(list)
    subjects.value = list
    loaded = true
  }

  return { subjects, loadSubjects, saveSubjects }
}