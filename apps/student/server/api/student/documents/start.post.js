// Bước 1 của upload: kiểm tra yêu cầu, đảm bảo folder sinh viên, mở phiên upload trên Drive.
// Folder và tên file do SERVER quyết định (không nhận từ client). Nếu loại tài liệu này đã upload,
// ghi đè lên đúng file cũ (fileId lấy từ DB, không nhận từ client).
export default defineEventHandler(async (event) => {
  const user = await requireStudentSession(event)
  const { docKey, mimeType } = parseUploadRequest(await readBody(event))

  const info = await getUploadContext(event, user.email)
  const folderId = await getStudentFolder(event, user, info)
  const fileName = buildFileName(info.mssv, docKey, mimeType)

  // File cũ chỉ được ghi đè khi vẫn còn và vẫn nằm trong folder của sinh viên này
  let fileId = null
  const oldId = info.uploadDocument?.[docKey]?.FileId
  if (oldId) {
    const old = await getDriveFile(oldId)
    if (old && !old.trashed && old.parents?.includes(folderId)) fileId = oldId
  }

  const uploadUrl = await startResumableUpload({
    fileId,
    name: fileName,
    mimeType,
    parentId: folderId,
    origin: getRequestHeader(event, 'origin'),
  })
  return { uploadUrl, fileName, replace: !!fileId }
})
