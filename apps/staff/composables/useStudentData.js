import * as studentRepository from '~/data/repositories/studentRepository.js'

export function useStudentData() {
  return { ...studentRepository }
}
