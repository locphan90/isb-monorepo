// server/utils/googleDrive.js (app sinh viên)
// Làm việc với Google Drive bằng service account: tạo phiên upload, kiểm tra file, tìm/tạo folder sinh viên.
// Mọi thứ ở đây chỉ chạy trên server; trình duyệt chỉ nhận uploadUrl rồi tự PUT file thẳng lên Google.
import { createSign } from 'node:crypto'

const SCOPE = 'https://www.googleapis.com/auth/drive'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const DRIVE = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3'

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')

let cachedToken = { value: null, expiresAt: 0 }

export const getDriveToken = async () => {
  if (cachedToken.value && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.value

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) {
    console.error('[Drive] Missing GOOGLE_SERVICE_ACCOUNT_JSON')
    throw createError({ statusCode: 500, statusMessage: 'SERVER_CONFIG_ERROR' })
  }

  let credentials
  try {
    credentials = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    console.error('[Drive] GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON')
    throw createError({ statusCode: 500, statusMessage: 'SERVER_CONFIG_ERROR' })
  }

  const now = Math.floor(Date.now() / 1000)
  const unsigned = `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({
    iss: credentials.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  })}`
  const signature = createSign('RSA-SHA256')
    .update(unsigned)
    .sign(String(credentials.private_key).replace(/\\n/g, '\n'), 'base64url')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.access_token) {
    console.error('[Drive] Token request failed:', res.status, data?.error_description || data?.error)
    throw createError({ statusCode: 502, statusMessage: 'DRIVE_ERROR' })
  }

  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 }
  return cachedToken.value
}

// Thông tin 1 file trên Drive; null nếu không tồn tại (hoặc service account không thấy)
export const getDriveFile = async (fileId) => {
  const token = await getDriveToken()
  const res = await fetch(
    `${DRIVE}/files/${encodeURIComponent(fileId)}?fields=id,name,size,mimeType,parents,trashed&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (res.status === 404) return null
  if (!res.ok) {
    console.error('[Drive] files.get failed:', res.status, (await res.text()).slice(0, 300))
    throw createError({ statusCode: 502, statusMessage: 'DRIVE_ERROR' })
  }
  return await res.json()
}

// Xoá file (dọn khi file upload lên không hợp lệ); lỗi chỉ log, không chặn luồng chính
export const deleteDriveFile = async (fileId) => {
  try {
    const token = await getDriveToken()
    await fetch(`${DRIVE}/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (e) {
    console.error('[Drive] delete failed:', e.message)
  }
}

// Mở phiên upload (resumable) và trả về uploadUrl để trình duyệt PUT file lên.
//  - Có fileId : GHI ĐÈ nội dung + đổi tên file đã có (giữ nguyên fileId và link)
//  - Không có  : tạo file mới trong folder `parentId`
export const startResumableUpload = async ({ fileId, name, mimeType, parentId, origin }) => {
  const token = await getDriveToken()
  const url = fileId
    ? `${DRIVE_UPLOAD}/files/${encodeURIComponent(fileId)}?uploadType=resumable&supportsAllDrives=true`
    : `${DRIVE_UPLOAD}/files?uploadType=resumable&supportsAllDrives=true`

  const res = await fetch(url, {
    method: fileId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Type': mimeType,
      // Để Google cho phép trình duyệt PUT file từ đúng domain này (CORS)
      ...(origin ? { Origin: origin } : {}),
    },
    body: JSON.stringify(fileId ? { name } : { name, parents: [parentId] }),
  })

  const uploadUrl = res.headers.get('location')
  if (!uploadUrl) {
    console.error('[Drive] Could not start upload:', res.status, (await res.text()).slice(0, 300))
    throw createError({ statusCode: 502, statusMessage: 'DRIVE_ERROR' })
  }
  return uploadUrl
}

// Tìm/tạo folder <rootFolderId>/<năm>/<MSSV>_<họ tên không dấu> bằng Edge Function trên Supabase
// (gọi nhiều lần vẫn ra cùng một folder). rootFolderId = StudentDoc của domain, xem studentDocuments.js
export const ensureStudentFolder = async (event, { mssv, fullName, rootFolderId }) => {
  const config = useRuntimeConfig(event)
  const baseUrl = String(config.supabaseUrl || '').replace(/\/$/, '')
  const fnName = process.env.STUDENT_FOLDER_FUNCTION || 'create-student-folder'

  let res
  try {
    res = await fetch(`${baseUrl}/functions/v1/${encodeURIComponent(fnName)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.supabaseServiceRoleKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: mssv, full_name: fullName || mssv, rootFolderId }),
      signal: AbortSignal.timeout(30000),
    })
  } catch (e) {
    console.error('[Drive] Folder function unreachable:', e.message)
    throw createError({ statusCode: 502, statusMessage: 'DRIVE_ERROR' })
  }

  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.studentFolderId) {
    console.error('[Drive] Folder function failed:', res.status, data?.error || data?.message)
    throw createError({ statusCode: 502, statusMessage: 'DRIVE_ERROR' })
  }
  return data.studentFolderId
}
