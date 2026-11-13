// Một <PermBtn> tự đăng ký nút của nó vào catalog. body: { menuKey, btnKey, label }
// Chỉ nhận định dạng hợp lệ, có giới hạn tổng số nút (DB kiểm tra). Cần đăng nhập (user thường mở trang cũng đăng ký được).
export default defineEventHandler(async (event) => {
  await requireStaffSession(event)
  const body = (await readBody(event)) || {}
  await rpcOrThrow(event, 'register_perm_button', {
    p_menu: String(body.menuKey ?? ''),
    p_btn: String(body.btnKey ?? ''),
    p_label: String(body.label ?? '').trim(),
  })
  return { ok: true }
})
