import { useSupabase } from '#imports'

const CAT = 'STUDENT_PROFILE_SETTINGS'

let _client = null
function getClient() {
  if (!_client) _client = useSupabase()
  return _client
}

export async function fetchDeptSettingsRow(menuKey) {
  const { data } = await getClient()
    .from('tbl_misc')
    .select('id, arr_json')
    .eq('cat', CAT)
    .eq('val', menuKey)
    .maybeSingle()
  return data ?? null
}

export async function insertDeptSettingsRow(menuKey, fields) {
  await getClient().from('tbl_misc').insert({ cat: CAT, val: menuKey, arr_json: { fields }, i_status: 0 })
}

export async function updateDeptSettingsRow(id, fields) {
  await getClient().from('tbl_misc').update({ arr_json: { fields } }).eq('id', id)
}
