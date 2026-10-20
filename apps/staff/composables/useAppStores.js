//composables/State.js
export function useSidebar() {
  return useState('sidebar_open', () => true)
}

export const useAppStores = () => {
  const userStore = useUserStore()
  return {
    snackbar: useSnackbarStore(),
    user: userStore.user, // extracts the inner user object directly
    ui: useUIStore(),
  }
}