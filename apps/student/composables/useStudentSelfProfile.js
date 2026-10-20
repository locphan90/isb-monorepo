// Composable mỏng cho trang sinh viên: giữ state + gọi repository, logic thuần nằm ở transformer
import { studentSelfRepository as repo } from '~/data/repositories/studentSelfRepository'
import {
  buildStudentFields, buildStudentGroupBlocks, toEditForm, diffEdit, validateEdit,
  translateError, errorCodeOf, isUnauthorized,
} from '#core/data/transformers/studentSelfEdit'

export const useStudentSelfProfile = () => {
  const snackbar = useSnackbarStore()
  const { clear } = useUserSession()
  const notify = (message, color = 'success') => snackbar.trigger({ message, color })

  const loading = ref(false)
  const saving = ref(false)
  const notRegistered = ref(false)
  const student = ref(null) // { mssv, studentId, fullName, profile, viewKeys, editKeys, dateKeys }
  const form = ref({})
  const errors = ref({})

  const fields = computed(() => (student.value ? buildStudentFields(student.value) : { readOnly: [], editable: [] }))
  // Thông tin chỉ xem nằm ngoài objProfile (Docs, objEng...), theo cấu hình của admin
  const groupBlocks = computed(() => (student.value ? buildStudentGroupBlocks(student.value) : []))
  const changes = computed(() =>
    student.value ? diffEdit(student.value.profile, form.value, student.value.editKeys) : {}
  )
  const hasChanges = computed(() => Object.keys(changes.value).length > 0)

  const signOut = async () => {
    await clear()
    await navigateTo('/login')
  }

  const load = async () => {
    loading.value = true
    try {
      const data = await repo.getMyProfile()
      if (!data) {
        notRegistered.value = true
        return
      }
      student.value = data
      form.value = toEditForm(data.profile, data.editKeys)
      errors.value = {}
    } catch (e) {
      if (isUnauthorized(e)) return signOut()
      notify(translateError(e), 'error')
    } finally {
      loading.value = false
    }
  }

  const submit = async () => {
    errors.value = validateEdit(form.value, fields.value.editable)
    if (Object.keys(errors.value).length) return false
    if (!hasChanges.value) {
      notify(translateError({ statusMessage: 'NO_CHANGES' }), 'error')
      return false
    }

    saving.value = true
    try {
      await repo.updateMyProfile(changes.value)
      notify('Your information has been updated.')
      await load()
      return true
    } catch (e) {
      if (isUnauthorized(e)) {
        await signOut()
        return false
      }
      notify(translateError(e), 'error')
      // Admin vừa đổi danh sách trường được sửa: tải lại để form khớp với cấu hình mới
      if (errorCodeOf(e) === 'FIELD_NOT_EDITABLE') await load()
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    loading, saving, notRegistered, student, form, errors,
    fields, groupBlocks, hasChanges, notify, load, submit, signOut,
  }
}
