// server/utils/studentDocuments.js (app sinh viên)
// Logic dùng chung cho các API upload tài liệu của sinh viên.
import { STUDENT_IMPORT_ITEMS, STUDENT_DOC_TYPES, STUDENT_DOC_MAX_BYTES } from '#core/data/schemas/studentSelfEdit'
import { domainFolders } from '#core/config/domains.js'

export const DOC_KEYS = STUDENT_IMPORT_ITEMS.map((i) => i.key)

// Giá trị mặc định: chưa upload (No). Gửi kèm khi ghi lần đầu để cả 5 loại đều hiện rõ trong obj_json.
export const emptyDocument = () => ({ Uploaded: false, FileName: '', FileId: '' })
export const defaultDocuments = () => Object.fromEntries(DOC_KEYS.map((k) => [k, emptyDocument()]))

// QUY TẮC ĐẶT TÊN FILE: <MSSV>_<loại tài liệu>.<đuôi>  vd WSU210001_CCCD.pdf
// Muốn đổi định dạng tên file thì chỉ sửa ở đây.
export const buildFileName = (mssv, docKey, mimeType) => {
  const safeMssv = String(mssv).replace(/[^A-Za-z0-9_-]/g, '_')
  return `${safeMssv}_${docKey}.${STUDENT_DOC_TYPES[mimeType]}`
}

// Kiểm tra dữ liệu client gửi lên khi xin phiên upload
export const parseUploadRequest = (body) => {
  const docKey = String(body?.docKey ?? '')
  const mimeType = String(body?.mimeType ?? '')
  const size = Number(body?.size)

  if (!DOC_KEYS.includes(docKey)) throw createError({ statusCode: 400, statusMessage: 'INVALID_DOC' })
  if (!STUDENT_DOC_TYPES[mimeType]) throw createError({ statusCode: 400, statusMessage: 'INVALID_FILE_TYPE' })
  if (!Number.isFinite(size) || size <= 0 || size > STUDENT_DOC_MAX_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'FILE_TOO_LARGE' })
  }
  return { docKey, mimeType, size }
}

// Thông tin sinh viên đang đăng nhập (email lấy từ session): { mssv, studentId, fullName, uploadDocument }
export const getUploadContext = async (event, email) => {
  const info = await rpcOrThrow(event, 'get_student_upload_info', { p_email: email })
  if (!info?.mssv) throw createError({ statusCode: 403, statusMessage: 'EMAIL_NOT_REGISTERED' })
  return info
}

// Thư mục gốc tài liệu sinh viên của domain (StudentDoc trong packages/core/config/domains.js,
// cùng nơi khai báo SA/AD/REG/AA). `domain` lấy từ cột domain của tbl_student.
const FOLDER_ID_RE = /^[A-Za-z0-9_-]{10,}$/
export const rootFolderFor = (domain) => {
  const id = domainFolders[String(domain ?? '')]?.StudentDoc
  if (!id || !FOLDER_ID_RE.test(id)) {
    console.error(`[Student Docs] No StudentDoc folder configured for domain "${domain ?? ''}"`)
    throw createError({ statusCode: 503, statusMessage: 'UPLOAD_NOT_CONFIGURED' })
  }
  return id
}

// Folder của sinh viên đang đăng nhập. Ưu tiên folder đã tạo lúc đăng nhập (nằm trong session đã ký);
// nếu lúc đăng nhập chưa tạo được thì tạo/tìm ngay bây giờ.
export const getStudentFolder = async (event, user, info) => {
  const cached = user?.studentFolderId
  if (typeof cached === 'string' && FOLDER_ID_RE.test(cached)) return cached
  return await ensureStudentFolder(event, {
    mssv: info.mssv,
    fullName: info.fullName,
    rootFolderId: rootFolderFor(info.domain),
  })
}

// Gọi lúc sinh viên đăng nhập: tạo/tìm folder <StudentDoc>/<năm>/<MSSV>_<họ tên>.
// KHÔNG bao giờ làm hỏng đăng nhập: lỗi chỉ ghi log, lúc upload sẽ thử lại và báo lỗi cho sinh viên.
export const prepareStudentFolder = async (event, email) => {
  try {
    const info = await rpcOrThrow(event, 'get_student_upload_info', { p_email: email })
    if (!info?.mssv) return null
    return await getStudentFolder(event, null, info)
  } catch (e) {
    console.error('[Student Auth] Folder setup skipped:', e?.statusMessage || e?.message || e)
    return null
  }
}

// Chỉ gửi về trình duyệt những gì cần hiển thị (không gồm fileId)
export const publicDocuments = (uploadDocument) =>
  Object.fromEntries(
    DOC_KEYS.map((k) => [
      k,
      { Uploaded: uploadDocument?.[k]?.Uploaded === true, FileName: uploadDocument?.[k]?.FileName || '' },
    ]),
  )
