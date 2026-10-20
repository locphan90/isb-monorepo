// apps/student/nuxt.config.ts
// Website cho SINH VIÊN (deploy riêng). Phần dùng chung nằm ở packages/core.
// App này KHÔNG có supabaseKey (anon) ở runtimeConfig.public: trình duyệt không bao giờ chạm Supabase,
// mọi truy vấn đi qua server (service role) sau khi đọc danh tính từ session.
export default defineNuxtConfig({
  extends: ['../../packages/core'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      title: 'ISB Student Portal',
    },
  },
})
