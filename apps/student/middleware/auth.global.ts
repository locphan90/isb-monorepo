// Chỉ phiên sinh viên (role = 'student') mới vào được các trang trong app này; còn lại về /login.
// Lưu ý: đây chỉ là điều hướng. Bảo mật thật nằm ở API server (requireStudentSession).
const PUBLIC_ROUTES = ['/login']

export default defineNuxtRouteMiddleware((to) => {
  if (PUBLIC_ROUTES.includes(to.path)) return

  const { loggedIn, user } = useUserSession()
  if (!loggedIn.value || user.value?.role !== 'student') {
    return navigateTo('/login')
  }
})
