const TABLE = 'tbl_misc'
const CAT = 'STUDENT_PROFILE_SETTINGS'

const settingsCache = ref({}) // { [menuKey]: { docs: true, objProfile: true, ... } }
const loadedKeys = new Set()

export function useStudentProfileSettings() {
  const supabase = useSupabase()

  // Trả về field-settings hiện tại của 1 menuKey (đọc từ cache nếu đã có).
  async function loadSettings(menuKey) {
    if (!menuKey) return {}
    if (loadedKeys.has(menuKey)) return settingsCache.value[menuKey]

    const { data } = await supabase
      .from(TABLE)
      .select('arr_json')
      .eq('cat', CAT)
      .eq('val', menuKey)
      .maybeSingle()

    settingsCache.value[menuKey] = data?.arr_json?.fields || {}
    loadedKeys.add(menuKey)
    return settingsCache.value[menuKey]
  }

  async function saveSettings(menuKey, fields) {
    const { data: existing } = await supabase
      .from(TABLE)
      .select('id')
      .eq('cat', CAT)
      .eq('val', menuKey)
      .maybeSingle()

    if (existing) {
      await supabase.from(TABLE).update({ arr_json: { fields } }).eq('id', existing.id)
    } else {
      await supabase.from(TABLE).insert({ cat: CAT, val: menuKey, arr_json: { fields }, i_status: 0 })
    }

    settingsCache.value[menuKey] = { ...fields }
    loadedKeys.add(menuKey)
  }

  return { settingsCache, loadSettings, saveSettings }
}
