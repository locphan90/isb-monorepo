// Composable mỏng cho trang Setting "Student Self-Edit"
import { studentSelfEditSettingRepository as repo } from '~/data/repositories/studentSelfEditSettingRepository'
import { FIELD_ACCESS, ALWAYS_SHOWN_KEYS } from '#core/data/schemas/studentSelfEdit'
import {
  buildSettingKeys, toAccessMap, fromAccessMap, getKeyLocks, fieldLabel,
  viewGroupCatalog, toGroupAccessMap, fromGroupAccessMap, translateError,
} from '#core/data/transformers/studentSelfEdit'

export const useStudentSelfEditSetting = () => {
  const snackbar = useSnackbarStore()
  const notify = (message, color = 'success') => snackbar.trigger({ message, color })

  const loading = ref(false)
  const saving = ref(false)
  const search = ref('')
  const keys = ref([])
  const setting = ref({ view: [], edit: [], groups: {}, neverView: [], neverEdit: [] })
  const access = ref({})      // trường objProfile: { [key]: 'hidden' | 'view' | 'edit' }
  const groupAccess = ref({}) // trường nhóm ngoài objProfile: { 'Docs::NatID': 'hidden' | 'view' }
  const original = ref('')

  const catalog = viewGroupCatalog()
  const snapshot = () => JSON.stringify({ access: access.value, groups: groupAccess.value })

  const q = computed(() => search.value?.trim().toLowerCase() ?? '')
  const rows = computed(() =>
    keys.value.map((key) => ({
      key,
      label: fieldLabel(key),
      alwaysShown: ALWAYS_SHOWN_KEYS.includes(key),
      ...getKeyLocks(key, setting.value),
    }))
  )
  const filteredRows = computed(() =>
    q.value ? rows.value.filter((r) => r.key.toLowerCase().includes(q.value) || r.label.toLowerCase().includes(q.value)) : rows.value
  )
  const filteredGroups = computed(() =>
    catalog
      .map((g) => ({
        ...g,
        fields: q.value
          ? g.fields.filter((f) => f.key.toLowerCase().includes(q.value) || f.label.toLowerCase().includes(q.value))
          : g.fields,
      }))
      .filter((g) => g.fields.length)
  )
  const counts = computed(() => {
    const values = Object.values(access.value)
    return {
      edit: values.filter((a) => a === FIELD_ACCESS.EDIT).length,
      view: values.filter((a) => a === FIELD_ACCESS.VIEW).length,
      other: Object.values(groupAccess.value).filter((a) => a === FIELD_ACCESS.VIEW).length,
    }
  })
  const hasChanges = computed(() => snapshot() !== original.value)

  // "3 of 10 shown" cho tiêu đề từng nhóm (tính trên toàn bộ trường của nhóm, không phụ thuộc ô tìm kiếm)
  const groupSummary = (group) => {
    const full = catalog.find((g) => g.path === group.path) ?? group
    const shown = full.fields.filter((f) => groupAccess.value[f.id] === FIELD_ACCESS.VIEW).length
    return `${shown} of ${full.fields.length} shown`
  }
  // Bật/tắt cả nhóm
  const setGroupAll = (group, value) => {
    const full = catalog.find((g) => g.path === group.path) ?? group
    for (const f of full.fields) groupAccess.value[f.id] = value
  }

  const load = async () => {
    loading.value = true
    try {
      const res = await repo.get()
      setting.value = res.setting
      keys.value = buildSettingKeys(res.keys, res.setting)
      access.value = toAccessMap(keys.value, res.setting)
      groupAccess.value = toGroupAccessMap(res.setting.groups)
      original.value = snapshot()
    } catch (e) {
      notify(translateError(e), 'error')
    } finally {
      loading.value = false
    }
  }

  const save = async () => {
    saving.value = true
    try {
      await repo.save({ ...fromAccessMap(access.value), groups: fromGroupAccessMap(groupAccess.value) })
      notify('Setting saved.')
      await load()
    } catch (e) {
      notify(translateError(e), 'error')
    } finally {
      saving.value = false
    }
  }

  return {
    loading, saving, search, filteredRows, filteredGroups, access, groupAccess,
    counts, hasChanges, groupSummary, setGroupAll, load, save,
  }
}
