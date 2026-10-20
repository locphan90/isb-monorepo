// apps/staff/nuxt.config.ts
// Website cho NHÂN VIÊN / admin. Phần dùng chung (Vuetify, snackbar, schema...) nằm ở packages/core.
export default defineNuxtConfig({
  extends: ['../../packages/core'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    geminiApiKey: process.env.GEMINI_API_KEY,
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY || '',
    },
  },
})
