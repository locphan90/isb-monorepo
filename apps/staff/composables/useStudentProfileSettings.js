// Cấu hình THEO PHÒNG BAN (menu): phòng ban được xem nhóm dữ liệu sinh viên nào. Đọc / lưu qua server (xem
// data/repositories/studentProfileSettingsRepository.js); server cũng dùng chính cấu hình này để lọc dữ liệu trả về.
import { fetchDeptSettings, saveDeptSettings } from '~/data/repositories/studentProfileSettingsRepository'

const settingsCache = ref({}) // { [menuKey]: { docs: true, objProfile: true, ... } }
const loadedKeys = new Set()

export function useStudentProfileSettings() {
  // Trả về field-settings hiện tại của 1 menuKey (đọc từ cache nếu đã có).
  async function loadSettings(menuKey) {
    if (!menuKey) return {}
    if (loadedKeys.has(menuKey)) return settingsCache.value[menuKey]

    try {
      settingsCache.value[menuKey] = await fetchDeptSettings(menuKey)
      loadedKeys.add(menuKey) // chỉ nhớ khi tải được; lỗi thì lần sau thử lại
    } catch {
      settingsCache.value[menuKey] = settingsCache.value[menuKey] || {}
    }
    return settingsCache.value[menuKey]
  }

  async function saveSettings(menuKey, fields) {
    await saveDeptSettings(menuKey, fields)
    settingsCache.value[menuKey] = { ...fields }
    loadedKeys.add(menuKey)
  }

  return { settingsCache, loadSettings, saveSettings }
}
