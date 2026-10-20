import { ui } from '#core/config/ui.js'
import { useTheme } from 'vuetify'

export function useAppTheme() {
  const theme = useTheme() // của Vuetify
  const userStore = useUserStore()
  const { user } = storeToRefs(userStore)

  const cssVars = computed(() => {
    const info = user.value?.domainInfo
    const primary = info?.color || ui.colors.primary

    return {
      '--theme-primary': primary,
      '--sidebar-bg': primary,
      '--logo-bg': info?.logoBackground || '#ffffff',
      '--toggle-color':
        info?.iconColor || (info?.logoBackground === '#ffffff' ? primary : '#ffffff'),
    }
  })

  // Đồng bộ màu primary của Vuetify theo domain hiện tại
  watch(
    () => cssVars.value['--theme-primary'],
    (primary) => {
      theme.themes.value.light.colors.primary = primary
    },
    { immediate: true }
  )

  return { cssVars }
}
