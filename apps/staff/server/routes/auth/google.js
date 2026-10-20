// server/routes/auth/google.get.js
import { PostgrestClient } from '@supabase/postgrest-js'
export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile'],
  },
  async onSuccess(event, { user }) {
    const config = useRuntimeConfig(event)

    const supabaseUrl =
      config.public?.supabaseUrl ||
      process.env.SUPABASE_URL ||
      process.env.NUXT_PUBLIC_SUPABASE_URL

    const supabaseKey =
      config.supabaseServiceRoleKey ||
      config.supabaseKey ||
      config.public?.supabaseKey ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_KEY ||
      process.env.NUXT_PUBLIC_SUPABASE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Auth Error] Missing Supabase credentials in server environment.')
      return sendRedirect(event, '/login?error=server_config_error')
    }

    const cleanEmail = user.email?.trim()

    if (!cleanEmail) {
      return sendRedirect(event, '/login?error=no_email')
    }

    try {
      // Points directly to the PostgREST REST endpoint
      const postgrest = new PostgrestClient(`${supabaseUrl}/rest/v1`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      })

      const { data: dbUser, error } = await postgrest
        .from('tbl_misc')
        .select('user_role:obj_json, user_right:arr_json')
        .eq('cat', 'USERS')
        .ilike('val', cleanEmail)
        .maybeSingle()

      if (error) throw error

      if (!dbUser) {
        console.warn(`[Auth Warning] Email ${cleanEmail} not found in database.`)
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
      return sendRedirect(event, '/login?error=db_error')
    }
  },
  onError(event, error) {
    console.error('[Auth Error] Google OAuth callback error:', error)
    return sendRedirect(event, '/login?error=auth_failed')
  },
})
