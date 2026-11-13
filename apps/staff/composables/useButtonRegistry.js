// Đây là phần "tự động phát hiện nút mới"
// - Chỉ cần dùng component <PermBtn menu-key="..." btn-key="..." label="...">
//   ở bất kỳ trang nào -> nút đó TỰ ghi mình vào catalog dùng chung (bảng
//   tbl_misc, cat='PERM_DEFS', val='BUTTONS') qua server (/api/permission-catalog).
// - Trang "System > User Manager" (tab Phân quyền) đọc catalog này để biết
//   TOÀN BỘ nút đang tồn tại trong app.
//
import { fetchButtonCatalog, registerButtonInCatalog } from '~/data/repositories/permissionRepository'

let catalogPromise = null

export function useButtonRegistry() {
  // Lấy catalog hiện tại (cache trong phiên làm việc để khỏi gọi lại liên tục)
  async function getCatalog() {
    if (!catalogPromise) {
      catalogPromise = fetchButtonCatalog().catch((e) => {
        catalogPromise = null // lỗi thì lần sau thử lại
        throw e
      })
    }
    return catalogPromise
  }

  // Gọi khi 1 <PermBtn> được render. Nếu nút (menuKey/btnKey) đã có trong
  // catalog rồi thì bỏ qua, không ghi lại (tránh gọi server mỗi lần vào trang).
  async function registerButton(menuKey, btnKey, label) {
    if (!menuKey || !btnKey) return

    try {
      const catalog = await getCatalog()
      const already = catalog?.[menuKey]?.[btnKey]
      if (already && already.label === label) return // đã biết, không cần ghi

      // cập nhật cache cục bộ ngay để các lần render tiếp theo trong phiên này khỏi ghi lại
      catalog[menuKey] = catalog[menuKey] || {}
      catalog[menuKey][btnKey] = { label }

      await registerButtonInCatalog(menuKey, btnKey, label)
    } catch {
      // đăng ký catalog chỉ phục vụ cây phân quyền: lỗi thì bỏ qua, không được làm hỏng việc hiển thị nút
    }
  }

  return { getCatalog, registerButton }
}
