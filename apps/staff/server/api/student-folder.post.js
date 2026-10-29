// server/api/student-folder.post.js
// Tạo (hoặc tìm) folder Drive của sinh viên: <thư mục gốc>/<năm>/<MSSV>_<họ tên không dấu>
// bằng Edge Function trên Supabase. Gọi từ server để service role key không lộ ra trình duyệt,
// và chỉ user admin có quyền menu mới gọi được (Edge Function tự nó chỉ kiểm tra có header Authorization).
const MENU_KEY = 'student-folder-test'
const STUDENT_ID_RE = /^[A-Za-z0-9_-]{1,40}$/
const FOLDER_ID_RE = /^[A-Za-z0-9_-]{10,}$/

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, MENU_KEY)

  const body = await readBody(event)
  const studentId = String(body?.studentId ?? '').trim()
  const fullName = String(body?.fullName ?? '').trim()
  const rootFolderId = String(body?.rootFolderId ?? '').trim()

  if (!STUDENT_ID_RE.test(studentId)) {
    throw createError({ statusCode: 400, statusMessage: 'INVALID_STUDENT_ID' })
  }
  if (!fullName || fullName.length > 100) {
    throw createError({ statusCode: 400, statusMessage: 'INVALID_FULL_NAME' })
  }
  if (!FOLDER_ID_RE.test(rootFolderId)) {
    throw createError({ statusCode: 400, statusMessage: 'INVALID_ROOT_FOLDER' })
  }

  const config = useRuntimeConfig(event)
  const baseUrl = String(config.supabaseUrl || config.public?.supabaseUrl || '').replace(/\/$/, '')
  const serviceKey = config.supabaseServiceRoleKey
  if (!baseUrl || !serviceKey) {
    console.error('[student-folder] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    throw createError({ statusCode: 500, statusMessage: 'CONFIG_MISSING' })
  }

  // Tên Edge Function: đặt trong STUDENT_FOLDER_FUNCTION nếu khác mặc định
  const fnName = process.env.STUDENT_FOLDER_FUNCTION || 'drive_create_student_folder'

  let res
  try {
    res = await fetch(`${baseUrl}/functions/v1/${encodeURIComponent(fnName)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      // Edge Function đọc tên trường full_name
      body: JSON.stringify({ studentId, full_name: fullName, rootFolderId }),
      signal: AbortSignal.timeout(30000),
    })
  } catch (e) {
    console.error('[student-folder] Edge Function unreachable:', e.message)
    throw createError({ statusCode: 502, statusMessage: 'FOLDER_FUNCTION_UNREACHABLE' })
  }

  const text = await res.text()
  let data = null
  try { data = JSON.parse(text) } catch { /* không phải JSON */ }

  if (!res.ok || !data?.studentFolderId) {
    const detail = data?.error || data?.message || text.slice(0, 300) || `HTTP ${res.status}`
    console.error('[student-folder] Edge Function failed:', res.status, detail)
    throw createError({ statusCode: 502, statusMessage: 'FOLDER_FUNCTION_FAILED', data: { detail } })
  }

  return {
    studentFolderId: data.studentFolderId,
    folderUrl: `https://drive.google.com/drive/folders/${data.studentFolderId}`,
  }
})
