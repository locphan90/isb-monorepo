// Bước 2 của upload: trình duyệt báo đã PUT xong. Server tự kiểm tra file trên Drive rồi mới ghi
// obj_json.UploadDocument (không tin client): file phải nằm trong folder của chính sinh viên này,
// đúng tên đã cấp và không vượt giới hạn dung lượng.
import { STUDENT_DOC_MAX_BYTES } from '#core/data/schemas/studentSelfEdit'

export default defineEventHandler(async (event) => {
  const user = await requireStudentSession(event)
  const body = await readBody(event)
  const docKey = String(body?.docKey ?? '')
  const fileId = String(body?.fileId ?? '')
  if (!DOC_KEYS.includes(docKey) || !/^[A-Za-z0-9_-]{10,}$/.test(fileId)) {
    throw createError({ statusCode: 400, statusMessage: 'INVALID_BODY' })
  }

  const info = await getUploadContext(event, user.email)
  const folderId = await getStudentFolder(event, user, info)

  const file = await getDriveFile(fileId)
  if (!file || file.trashed || !file.parents?.includes(folderId)) {
    throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })
  }
  // Tên phải đúng dạng <MSSV>_<loại>.<đuôi> và loại tài liệu phải khớp với docKey đang xác nhận
  const expectedPrefix = buildFileName(info.mssv, docKey, 'application/pdf').replace(/\.pdf$/, '.')
  if (!file.name?.startsWith(expectedPrefix)) {
    throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })
  }
  if (Number(file.size) > STUDENT_DOC_MAX_BYTES) {
    await deleteDriveFile(fileId)
    throw createError({ statusCode: 400, statusMessage: 'FILE_TOO_LARGE' })
  }

  const uploadDocument = await rpcOrThrow(event, 'set_student_upload_document', {
    p_email: user.email,
    p_key: docKey,
    p_info: { Uploaded: true, FileName: file.name, FileId: file.id, UploadedAt: new Date().toISOString() },
    p_defaults: defaultDocuments(),
  })
  return { documents: publicDocuments(uploadDocument) }
})
