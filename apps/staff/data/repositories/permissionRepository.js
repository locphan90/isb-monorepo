// Đọc/ghi catalog nút dùng chung (tbl_misc, cat='PERM_DEFS', val='BUTTONS').
// I/O Supabase — logic cache/orchestration nằm ở composables/useButtonRegistry.js.

import { useSupabase } from '#imports'

const CAT = 'PERM_DEFS'
const VAL = 'BUTTONS'

let _client = null
function getClient() {
  if (!_client) _client = useSupabase()
  return _client
}

export async function fetchButtonCatalogRow() {
  const { data } = await getClient()
    .from('tbl_misc')
    .select('id, arr_json')
    .eq('cat', CAT)
    .eq('val', VAL)
    .maybeSingle()
  return data ?? null
}

export async function insertButtonCatalogRow(arrJson) {
  await getClient().from('tbl_misc').insert({ cat: CAT, val: VAL, arr_json: arrJson, i_status: 0 })
}

export async function updateButtonCatalogRow(id, arrJson) {
  await getClient().from('tbl_misc').update({ arr_json: arrJson }).eq('id', id)
}
