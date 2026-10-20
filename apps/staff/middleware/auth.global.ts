const PUBLIC_ROUTES = ['/login']
export default defineNuxtRouteMiddleware(async (to) => {
  if (PUBLIC_ROUTES.includes(to.path)) return

  const { loggedIn, user: sessionUser } = useUserSession()
  if (!loggedIn.value) {
    return navigateTo('/login')
  }
  const userStore = useUserStore()
  if (!userStore.user.isLoggedIn || userStore.user.email !== sessionUser.value?.email) {
    await userStore.fetchUserProfile(sessionUser.value?.email)
  }
})