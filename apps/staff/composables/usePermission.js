
const SUPER_ADMIN_RANKS = ['SYS', 'SYSADMIN']
export function usePermission() {
  const userStore = useUserStore()
  const { user } = storeToRefs(userStore)
  const { settingsCache } = useStudentProfileSettings()

  const isSuperAdmin = computed(() => SUPER_ADMIN_RANKS.includes(user.value?.rank))

  // menuKey = null/undefined  -> luôn cho phép (dùng cho mục `public: true`,
  // việc này đã được xử lý ở nơi gọi, nhưng để an toàn vẫn cho qua ở đây)
  function canMenu(menuKey) {
    if (!menuKey) return true
    if (isSuperAdmin.value) return true
    return user.value?.permissions?.[menuKey]?.menu === true
  }

  function canButton(menuKey, btnKey) {
    if (isSuperAdmin.value) return true
    return user.value?.permissions?.[menuKey]?.buttons?.[btnKey] === true
  }

  // Cấu hình THEO PHÒNG BAN (không theo user) — xem useDeptSettings.js.
  // SYS/SYSADMIN vẫn luôn thấy hết, kể cả khi phòng ban chưa cấu hình gì.
  function canField(menuKey, fieldGroupKey) {
    if (isSuperAdmin.value) return true
    return settingsCache.value?.[menuKey]?.[fieldGroupKey] === true
  }

  return { canMenu, canButton, canField, isSuperAdmin }
}
