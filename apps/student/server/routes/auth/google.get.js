// apps/student/server/routes/auth/google.get.js
// Đăng nhập Google cho SINH VIÊN (app riêng, tách hẳn khỏi /auth/google của app staff).
// Cần thêm redirect URI https://<domain-sinh-vien>/auth/google vào OAuth client trong Google Cloud Console.
export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile'],
  },
  async onSuccess(event, { user }) {
    const email = user.email?.trim()
    if (!email) return sendRedirect(event, '/login?error=no_email')
    if (user.email_verified === false) return sendRedirect(event, '/login?error=no_email')

    try {
      const { data, error } = await useSupabaseAdmin(event).rpc('get_student_self', { p_email: email })
      if (error) {
        if ((error.message || '').includes('EMAIL_DUPLICATED')) {
          return sendRedirect(event, '/login?error=email_duplicated')
        }
        throw error
      }
      if (!data) {
        console.warn(`[Student Auth] Email ${email} not found in tbl_student.`)
        return sendRedirect(event, '/login?error=not_registered')
      }

      // Tạo/tìm folder Drive của sinh viên ngay khi đăng nhập (lỗi chỉ ghi log, không chặn đăng nhập).
      // ID nằm trong session đã ký nên các API upload dùng lại mà không phải tạo lại.
      const studentFolderId = await prepareStudentFolder(event, email)

      await setUserSession(event, {
        user: {
          email,
          name: user.name,
          avatar: user.picture,
          role: 'student',
          mssv: data.mssv,
          ...(studentFolderId ? { studentFolderId } : {}),
        },
      })
      return sendRedirect(event, '/profile')
    } catch (err) {
      console.error('[Student Auth] Lookup failed:', err?.message || err)
      return sendRedirect(event, '/login?error=db_error')
    }
  },
  onError(event, error) {
    console.error('[Student Auth] Google OAuth callback error:', error)
    return sendRedirect(event, '/login?error=auth_failed')
  },
})
