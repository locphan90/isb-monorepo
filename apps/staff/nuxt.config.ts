// apps/staff/nuxt.config.ts
// Website cho NHÂN VIÊN / admin. Phần dùng chung (Vuetify, snackbar, schema...) nằm ở packages/core.
export default defineNuxtConfig({
  extends: ['../../packages/core'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Component của app staff: tắt tiền tố theo thư mục con (components/Foo/Bar.vue vẫn là <Bar>, không phải <FooBar>).
  // Cấu hình tương tự ở packages/core chỉ áp dụng cho components của core.
  components: [
    { path: '~/components', pathPrefix: false },
  ],

  runtimeConfig: {
    geminiApiKey: process.env.GEMINI_API_KEY,
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY || '',
    },
  },
})
