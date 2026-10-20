// Đây là phần "tự động phát hiện nút mới"
// - Chỉ cần dùng component <PermBtn menu-key="..." btn-key="..." label="...">
//   ở bất kỳ trang nào -> nút đó TỰ ghi mình vào catalog dùng chung (bảng
//   tbl_misc, cat='PERM_DEFS', val='BUTTONS')
// - Trang "System > User Manager" (tab Phân quyền) đọc catalog này để biết
//   TOÀN BỘ nút đang tồn tại trong app.
//

let catalogPromise = null

async function fetchCatalogRow(supabase) {
  const { data } = await supabase
    .from('tbl_misc')
    .select('id, arr_json')
    .eq('cat', 'PERM_DEFS')
    .eq('val', 'BUTTONS')
    .maybeSingle()
  return data ?? null
}

export function useButtonRegistry() {
  const supabase = useSupabase()

  // Lấy catalog hiện tại (cache trong phiên làm việc để khỏi query lại liên tục)
  async function getCatalog() {
    if (!catalogPromise) {
      catalogPromise = fetchCatalogRow(supabase).then((row) => row?.arr_json ?? {})
    }
    return catalogPromise
  }

  // Gọi khi 1 <PermBtn> được render. Nếu nút (menuKey/btnKey) đã có trong
  // catalog rồi thì bỏ qua, không ghi lại (tránh spam update mỗi lần vào trang).
  async function registerButton(menuKey, btnKey, label) {
    if (!menuKey || !btnKey) return

    const catalog = await getCatalog()
    const already = catalog?.[menuKey]?.[btnKey]
    if (already && already.label === label) return // đã biết, không cần ghi

    // cập nhật cache cục bộ ngay để các lần render tiếp theo trong phiên này khỏi ghi lại
    catalog[menuKey] = catalog[menuKey] || {}
    catalog[menuKey][btnKey] = { label }

    const row = await fetchCatalogRow(supabase)
    if (!row) {
      await supabase.from('tbl_misc').insert({
        cat: 'PERM_DEFS',
        val: 'BUTTONS',
        arr_json: { [menuKey]: { [btnKey]: { label } } },
        i_status: 0,
      })
    } else {
      const merged = {
        ...row.arr_json,
        [menuKey]: { ...(row.arr_json?.[menuKey] || {}), [btnKey]: { label } },
      }
      await supabase.from('tbl_misc').update({ arr_json: merged }).eq('id', row.id)
    }
  }

  return { getCatalog, registerButton }
}
