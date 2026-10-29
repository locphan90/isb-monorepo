// Trạng thái upload của CHÍNH sinh viên đang đăng nhập: { CCCD: { Uploaded, FileName }, ... }
export default defineEventHandler(async (event) => {
  const user = await requireStudentSession(event)
  const info = await getUploadContext(event, user.email)
  return { documents: publicDocuments(info.uploadDocument) }
})
