import { useSupabase } from '#imports'

const TABLE = 'tbl_misc'
const CAT = 'USERS'

let _client = null
function getClient() {
  if (!_client) _client = useSupabase()
  return _client
}

export async function fetchUsers() {
  const { data, error } = await getClient()
    .from(TABLE)
    .select('id, val, obj_json, arr_json, i_status')
    .eq('cat', CAT)
    .order('val')

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.val,
    i_status: row.i_status,
    obj_json: row.obj_json,
    arr_json: row.arr_json,
  }))
}

export async function fetchUserArrJson(id) {
  const { data, error } = await getClient().from(TABLE).select('arr_json').eq('id', id).single()
  if (error) throw error
  return data?.arr_json ?? {}
}

export async function createUser({ email, role, permissions, lastUser }) {
  const { error } = await getClient()
    .from(TABLE)
    .insert({
      val: email,
      cat: CAT,
      obj_json: role,
      arr_json: { PERMISSIONS: permissions },
      last_user: lastUser,
      i_status: 0,
    })
  if (error) throw error
}

export async function updateUser(id, { email, role, permissions, lastUser }) {
  // Giữ nguyên mọi key khác đã có trong arr_json (vd ISB_APP cũ), chỉ
  // ghi đè phần PERMISSIONS.
  const currentArrJson = await fetchUserArrJson(id)
  const mergedArrJson = { ...currentArrJson, PERMISSIONS: permissions }

  const { error } = await getClient()
    .from(TABLE)
    .update({ val: email, obj_json: role, arr_json: mergedArrJson, last_user: lastUser })
    .eq('id', id)
  if (error) throw error
}

export async function retireUser(id, lastUser) {
  const { error } = await getClient()
    .from(TABLE)
    .update({ i_status: 1, last_user: lastUser })
    .eq('id', id)
  if (error) throw error
}
