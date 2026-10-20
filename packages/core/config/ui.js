export const ui = {
  // Màu mặc định (khi user chưa có domainInfo, hoặc cho các thành phần
  // không đổi theo domain). Vuetify (plugins/vuetify.js) và phần đổi màu
  // theo domain (composables/useAppTheme.js) đều đọc từ đây.
  colors: {
    primary: '#a10930',
    secondary: '#0855e3',
    accent: '#82B1FF',
    error: '#FF5252',
    info: '#800080',
    success: '#4CAF50',
    warning: '#FFC107',
  },

  font: {
    family: 'Inter, system-ui, sans-serif',
    size: '15px',
    googleFont: 'Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700',
  },

  field: {
    variant: 'outlined',
    density: 'compact',
    borderRadius: '6px',
    borderColor: '#d1d5db',
    focusBorderColor: '#0855e3',
    clearable: true,
  },

  select: {
    variant: 'outlined',
    density: 'compact',
  },

  checkbox: {
    density: 'compact',
    color: '#0855e3',
  },
}
