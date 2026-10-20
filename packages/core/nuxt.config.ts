// packages/core/nuxt.config.ts
// Layer dùng chung cho 2 app (staff + student): giao diện Vuetify, snackbar, schema/transformer
// sinh viên và client Supabase phía server. App nào cũng `extends` layer này.
//
// LƯU Ý QUAN TRỌNG khi viết code TRONG layer này:
//   - Trong layer, `~/` luôn trỏ về thư mục của APP đang chạy, KHÔNG phải về layer.
//     Vì vậy file trong packages/core chỉ import bằng đường dẫn tương đối (./ ../).
//   - App import file của core bằng alias `#core/...` (vd: '#core/data/schemas/studentSelfEdit').
import { fileURLToPath } from 'node:url'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import { ui } from './config/ui.js'

const coreDir = fileURLToPath(new URL('.', import.meta.url)).replace(/[\\/]$/, '')

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  alias: {
    '#core': coreDir,
  },

  modules: [
    'nuxt-auth-utils',
    '@pinia/nuxt',
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        config.plugins ||= []
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
  ],

  // pathPrefix: false -> tên thẻ component KHÔNG bị đổi theo tên thư mục con
  // (vd components/Foo/Bar.vue vẫn là <Bar>, không phải <FooBar>).
  components: [
    { path: `${coreDir}/components`, pathPrefix: false },
  ],

  build: {
    transpile: ['vuetify'],
  },

  // File server nằm trong packages/core (ngoài thư mục gốc của app) mặc định bị Nitro coi là "external":
  // nạp thẳng bằng Node, không qua bundler -> mất auto-import (useRuntimeConfig...) và không dùng được #imports.
  // `inline` buộc Nitro bundle thư mục này như code của chính app.
  nitro: {
    externals: {
      inline: [coreDir],
    },
  },

  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },

  css: [
    'vuetify/styles',
    `${coreDir}/assets/main.css`,
  ],

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: `https://fonts.googleapis.com/css2?family=${ui.font.googleFont}&display=swap`,
        },
      ],
      style: [
        {
          innerHTML: `
            :root {
              --font-family: ${ui.font.family};
              --font-size: ${ui.font.size};
              --field-border: ${ui.field.borderColor};
              --field-border-focus: ${ui.field.focusBorderColor};
              --field-radius: ${ui.field.borderRadius};
              --checkbox-color: ${ui.checkbox.color};
            }
          `,
        },
      ],
    },
  },

  // Chỉ khai báo phần PRIVATE dùng chung (server). Key này tuyệt đối không đưa vào `public`.
  // App staff tự thêm `public.supabaseUrl/supabaseKey` vì code cũ của staff còn gọi Supabase từ trình duyệt;
  // app student thì không cần (trình duyệt không chạm Supabase).
  runtimeConfig: {
    supabaseUrl: process.env.NUXT_SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || '',
    supabaseServiceRoleKey: process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY || '',
  },
})
