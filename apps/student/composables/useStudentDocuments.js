// Upload 5 loại tài liệu của sinh viên: xin phiên upload (server) -> PUT file thẳng lên Google Drive -> báo server ghi nhận.
// Trạng thái "đã upload" luôn lấy từ server (obj_json.UploadDocument), không tự suy ra ở trình duyệt.
import { studentSelfRepository as repo } from '~/data/repositories/studentSelfRepository'
import { STUDENT_DOC_TYPES, STUDENT_DOC_MAX_BYTES, STUDENT_DOC_MAX_MB } from '#core/data/schemas/studentSelfEdit'
import { isUnauthorized } from '#core/data/transformers/studentSelfEdit'

// Một số trình duyệt để trống file.type: suy ra từ đuôi file
const MIME_BY_EXT = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' }

const UPLOAD_ERRORS = {
  INVALID_FILE_TYPE: 'Only PDF, JPG or PNG files are accepted.',
  FILE_TOO_LARGE: `The file is too large (maximum ${STUDENT_DOC_MAX_MB} MB).`,
  INVALID_DOC: 'This document type is not valid.',
  EMAIL_NOT_REGISTERED: 'This email is not registered. Please contact the Registrar.',
  DRIVE_ERROR: 'The file could not be stored right now. Please try again later.',
  UPLOAD_NOT_CONFIGURED: 'Document upload is not available for your program yet. Please contact the Registrar.',
  SERVER_CONFIG_ERROR: 'The server is not configured correctly. Please contact the administrator.',
  FORBIDDEN: 'You do not have permission to do this.',
}

export const resolveMime = (file) => {
  if (STUDENT_DOC_TYPES[file.type]) return file.type
  const ext = String(file.name || '').split('.').pop().toLowerCase()
  return MIME_BY_EXT[ext] ?? null
}

export const useStudentDocuments = () => {
  const snackbar = useSnackbarStore()
  const { clear } = useUserSession()
  const notify = (message, color = 'success') => snackbar.trigger({ message, color })

  const documents = ref({}) // { [docKey]: { Uploaded, FileName } }
  const uploadingKey = ref('')

  const isUploaded = (key) => documents.value[key]?.Uploaded === true
  const fileNameOf = (key) => documents.value[key]?.FileName || ''

  const messageOf = (e) => {
    const text = [e?.data?.statusMessage, e?.statusMessage, e?.message].filter(Boolean).join(' | ')
    const code = Object.keys(UPLOAD_ERRORS).find((c) => text.includes(c))
    return code ? UPLOAD_ERRORS[code] : 'Upload failed. Please try again.'
  }

  const handleError = async (e) => {
    if (isUnauthorized(e)) {
      await clear()
      await navigateTo('/login')
      return
    }
    notify(messageOf(e), 'error')
  }

  const load = async () => {
    try {
      documents.value = await repo.getMyDocuments()
    } catch (e) {
      await handleError(e)
    }
  }

  // Trả true nếu upload và ghi nhận thành công
  const upload = async (item, file) => {
    if (!file || uploadingKey.value) return false

    const mimeType = resolveMime(file)
    if (!mimeType) {
      notify(UPLOAD_ERRORS.INVALID_FILE_TYPE, 'error')
      return false
    }
    if (file.size <= 0 || file.size > STUDENT_DOC_MAX_BYTES) {
      notify(UPLOAD_ERRORS.FILE_TOO_LARGE, 'error')
      return false
    }

    uploadingKey.value = item.key
    try {
      const { uploadUrl } = await repo.startDocumentUpload({ docKey: item.key, mimeType, size: file.size })

      // File có type rỗng thì gắn lại type để khớp với phiên upload
      const body = file.type === mimeType ? file : new File([file], file.name, { type: mimeType })
      const res = await fetch(uploadUrl, { method: 'PUT', body })
      if (!res.ok) throw new Error('UPLOAD_FAILED')
      const driveFile = await res.json()

      const result = await repo.completeDocumentUpload({ docKey: item.key, fileId: driveFile.id })
      documents.value = result.documents
      notify(`${item.label} uploaded.`)
      return true
    } catch (e) {
      await handleError(e)
      return false
    } finally {
      uploadingKey.value = ''
    }
  }

  return { documents, uploadingKey, isUploaded, fileNameOf, load, upload }
}
