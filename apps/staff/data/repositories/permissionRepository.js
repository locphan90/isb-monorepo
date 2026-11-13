// Đọc/ghi catalog nút dùng chung (tbl_misc, cat='PERM_DEFS', val='BUTTONS') qua server (/api/permission-catalog).
// Trình duyệt không còn đọc/ghi bảng này bằng anon key. Logic cache/orchestration nằm ở composables/useButtonRegistry.js.

// => { [menuKey]: { [btnKey]: { label } } }
export async function fetchButtonCatalog() {
  const { catalog } = await $fetch('/api/permission-catalog')
  return catalog ?? {}
}

// Đăng ký (gộp) một nút vào catalog; server kiểm tra định dạng và giới hạn tổng số nút
export async function registerButtonInCatalog(menuKey, btnKey, label) {
  await $fetch('/api/permission-catalog', { method: 'POST', body: { menuKey, btnKey, label } })
}
