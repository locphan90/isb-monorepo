// server/routes/auth/google.js
// Đăng nhập staff bằng Google. Chỉ email đang có trong tbl_misc (cat = 'USERS') và còn hoạt động mới được vào.
// Tra cứu bằng service role (useSupabaseAdmin: thiếu khóa thì báo lỗi, KHÔNG fallback sang anon key như trước).
export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile'],
  },
  async onSuccess(event, { user }) {
    const cleanEmail = user.email?.trim()

    if (!cleanEmail) {
      return sendRedirect(event, '/login?error=no_email')
    }
    // Google báo email chưa xác minh thì không cho vào (tài khoản Gmail luôn đã xác minh)
    if (user.email_verified === false) {
      return sendRedirect(event, '/login?error=not_authorized')
    }

    try {
      const { data: dbUser, error } = await useSupabaseAdmin(event)
        .from('tbl_misc')
        .select('val')
        .eq('cat', 'USERS')
        .or('i_status.is.null,i_status.eq.0') // user đã bị khóa / retire không đăng nhập được
        .ilike('val', escapeLike(cleanEmail)) // escape _ và % để email không thành mẫu khớp rộng
        .maybeSingle()

      if (error) throw error

      if (!dbUser) {
        console.warn(`[Auth Warning] Email ${cleanEmail} not found or inactive.`)
        return sendRedirect(event, '/login?error=not_authorized')
      }

      await setUserSession(event, {
        user: {
          email: user.email,
          name: user.name,
          avatar: user.picture,
        },
      })

      return sendRedirect(event, '/')
    } catch (err) {
      console.error('[Auth Error] Supabase query failed:', err?.message || err)
      const missingConfig = err?.statusMessage === 'SERVER_CONFIG_ERROR'
      return sendRedirect(event, `/login?error=${missingConfig ? 'server_config_error' : 'db_error'}`)
    }
  },
  onError(event, error) {
    console.error('[Auth Error] Google OAuth callback error:', error)
    return sendRedirect(event, '/login?error=auth_failed')
  },
})
