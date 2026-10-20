// plugins/vuetify.js
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { h } from 'vue'
import { ui } from '../config/ui.js'

// Custom Material Symbols (Outlined)
const materialOutlined = {
  component: (props) =>
    h(
      'span',
      {
        class: 'material-symbols-outlined',
        style: { fontVariationSettings: '"OPSZ" 24' }
      },
      props.icon
    )
}

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components,
    directives,
    defaults: {
      // 1 kiểu nút duy nhất cho toàn app (giống nút "Do smth Once" ở Test-Page) —
      // mọi <v-btn> ở bất kỳ đâu, kể cả trang mới sau này, tự đồng bộ theo đây,
      // không cần khai tay class/color ở từng chỗ.
      VBtn: {
        class: 'text-none',
        color: 'primary',
      },
      VTextField: {
        variant: ui.field.variant,
        density: ui.field.density,
      },
      VAutocomplete: {
        variant: ui.field.variant,
        density: ui.field.density,
        clearable: true
      },
      VSelect: {
        variant: ui.select.variant,
        density: ui.select.density,
      },
      VCombobox: {
        variant: ui.field.variant,
        density: ui.field.density,
      },
      VTextarea: {
        variant: ui.field.variant,
        density: ui.field.density,
      },
      VCheckbox: {
        density: ui.checkbox.density,
        color: ui.checkbox.color,
      },
    },
    icons: {
      defaultSet: 'mdi',      // ← keep Vuetify's built-in mdi set
      sets: {
        // DO NOT redefine mdi — keep Vuetify default!
        material: materialOutlined // ← only add our new set
      }
    },

    theme: {
      defaultTheme: 'light',
      themes: {
        // `primary` ở đây là màu KHỞI ĐẦU/mặc định (vd trước khi biết domain,
        // hoặc domain không có màu riêng). Sau khi biết domain, màu `primary`
        // này được cập nhật lại lúc chạy bởi composables/useAppTheme.js —
        // xem file đó để biết phần đổi màu theo domain.
        light: { colors: ui.colors }
      }
    }
  })

  nuxtApp.vueApp.use(vuetify)
})
