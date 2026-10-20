// stores/ui.js
//
// GỘP LẠI từ 3 file cũ trùng ID Pinia:
//   - stores/gui.js       -> defineStore('ui', { isBusy, MainDesk })
//   - stores/appStore.js  -> defineStore('ui', { view2Show: {isBusy,...} })
//                             + defineStore('snackbar', {...})
//   - stores/snackbar.js  -> defineStore('snackbar', {...}) (trùng y hệt appStore.js)
// data/repositories/legacyApiRepository.js, config/QLSV_FormConfig.js).

import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    view2Show: {
      isBusy: false,
      useBackupAPI: false,
    },
    MainDesk: false, // giữ lại từ bản gui.js cũ, hiện chưa nơi nào dùng
  }),
})

export const useSnackbarStore = defineStore('snackbar', {
  state: () => ({
    show: false,
    message: '',
    color: 'success',
    timeout: 3200,
  }),
  actions: {
    trigger({ message = '', color = 'success', timeout = 3000 } = {}) {
      this.message = message
      this.color = color
      this.timeout = timeout
      this.show = true
    },
  },
})
