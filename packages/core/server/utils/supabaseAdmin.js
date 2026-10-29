// server/utils/supabaseAdmin.js
import { PostgrestClient } from '@supabase/postgrest-js'
import { createError } from 'h3'
// Phải import tường minh: Nitro không tự thêm auto-import (useRuntimeConfig...) cho file nằm trong layer này
import { useRuntimeConfig } from '#imports'

// Client phía server dùng service role key.
// Key này chỉ nằm trong runtimeConfig PRIVATE, tuyệt đối không đưa vào runtimeConfig.public.
export const useSupabaseAdmin = (event) => {
  const config = useRuntimeConfig(event)
  // Ưu tiên khai báo private (app student); app staff vẫn đọc được từ public như trước
  const url = config.supabaseUrl || config.public?.supabaseUrl
  const key = config.supabaseServiceRoleKey // không fallback sang anon key: thiếu key thì báo lỗi
  if (!url || !key) {
    console.error('[Server] Missing config:', !url && 'SUPABASE_URL', !key && 'SUPABASE_SERVICE_ROLE_KEY')
    throw createError({ statusCode: 500, statusMessage: 'SERVER_CONFIG_ERROR' })
  }
  return new PostgrestClient(`${url}/rest/v1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
}

// Mã lỗi nghiệp vụ do RPC raise exception -> mã HTTP
const RPC_ERROR_STATUS = {
  EMAIL_NOT_REGISTERED: 403,
  EMAIL_DUPLICATED: 409,
  FIELD_NOT_EDITABLE: 403,
  NO_CHANGES: 400,
  INVALID_BODY: 400,
  INVALID_VALUE: 400,
  KEY_LOCKED: 400,
  FORBIDDEN: 403,
  SESSION_NOT_FOUND: 404,
  COURSE_NOT_FOUND: 404,
  DUPLICATE_SESSION: 409,
  LECTURER_NOT_FOUND: 404,
}

// Gọi RPC; lỗi nghiệp vụ trả về đúng mã (client dịch ra câu thông báo), lỗi khác chỉ log phía server
export const rpcOrThrow = async (event, fn, args = {}) => {
  const { data, error } = await useSupabaseAdmin(event).rpc(fn, args)
  if (error) {
    const code = Object.keys(RPC_ERROR_STATUS).find((c) => (error.message || '').includes(c))
    if (code) throw createError({ statusCode: RPC_ERROR_STATUS[code], statusMessage: code })
    console.error(`[RPC ${fn}]`, error.message || error)
    throw createError({ statusCode: 500, statusMessage: 'DB_ERROR' })
  }
  return data
}
