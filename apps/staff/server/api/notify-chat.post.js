// server/api/notify-chat.post.js
// Gửi thông báo vào Google Chat của một domain. URL webhook (có key + token) nằm trong biến môi trường
// GCHAT_WEBHOOK_<DOMAIN> trên server, KHÔNG để trong code chạy ở trình duyệt.
const DOMAINS = ['EAP', 'ISP', 'WSU', 'MBA'] // khớp arrDomain trong utils/globals.js

export default defineEventHandler(async (event) => {
  await requireStaffSession(event)

  const body = await readBody(event)
  const domain = String(body?.domain ?? '')
  const text = String(body?.message ?? '').trim().slice(0, 4000)

  if (!DOMAINS.includes(domain)) throw createError({ statusCode: 400, statusMessage: 'INVALID_DOMAIN' })
  if (!text) throw createError({ statusCode: 400, statusMessage: 'EMPTY_MESSAGE' })

  const webhook = process.env[`GCHAT_WEBHOOK_${domain}`]
  if (!webhook) {
    console.error(`[notify-chat] Missing GCHAT_WEBHOOK_${domain}`)
    throw createError({ statusCode: 500, statusMessage: 'CHAT_NOT_CONFIGURED' })
  }

  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(15000),
  }).catch((e) => {
    console.error('[notify-chat] Request failed:', e.message)
    return null
  })
  if (!res?.ok) {
    console.error('[notify-chat] Google Chat responded:', res?.status)
    throw createError({ statusCode: 502, statusMessage: 'CHAT_FAILED' })
  }
  return { success: true }
})
