// composables/useSupabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export const useSupabase = (): SupabaseClient => {
  const config = useRuntimeConfig()

  if (import.meta.server) {
    return createClient(config.public.supabaseUrl, config.public.supabaseKey, {
      realtime: {
        transport: WebSocket,
      },
    })
  }

  if (!client) {
    client = createClient(config.public.supabaseUrl, config.public.supabaseKey)
  }

  return client
}
