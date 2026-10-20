<!--
  System > Student Data Display
  Chọn menu có trang danh sách sinh viên, rồi tích nhóm dữ liệu nào được hiện ở bảng danh sách / trang chi tiết của menu đó.
  Cấu hình lưu theo MENU (không theo user); đọc lại bằng canField() trong usePermission.js.
-->
<template>
  <div class="setting-page">
    <div class="form-card">
      <div class="field">
        <label class="label">Menu</label>
        <select v-model="selectedMenuKey" @change="onSelect">
          <option value="" disabled>— select menu —</option>
          <option v-for="m in studentListMenus" :key="m.key" :value="m.key">
            {{ m.parentLabel ? `${m.parentLabel} — ${m.label}` : m.label }}
          </option>
        </select>
      </div>

      <template v-if="selectedMenuKey">
        <div class="divider" />
        <div class="section-heading">Data groups displayed</div>
        <label v-for="g in groups" :key="g.key" class="check-row">
          <input v-model="fields[g.key]" type="checkbox" />
          <span>{{ g.label }}</span>
        </label>

        <div class="divider" />
        <div class="actions">
          <v-btn :loading="saving" @click="save">Save</v-btn>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { menuItems } from '~/config/menu.js'
import { studentProfileSchema } from '#core/data/schemas/studentProfileSchema.js'

definePageMeta({ title: 'Setting - Student Data Display' })

const groups = studentProfileSchema.groups
const { loadSettings, saveSettings } = useStudentProfileSettings()
const snackbar = useSnackbarStore()

// Chỉ lấy menu có trang danh sách sinh viên (menu.js đánh dấu `studentList: true`), kể cả menu con nhiều cấp
const collectStudentListMenus = (items, parentLabel = '') =>
  items.flatMap((item) => [
    ...(item.studentList ? [{ key: item.key, label: item.label, parentLabel }] : []),
    ...collectStudentListMenus(item.children ?? [], item.label),
  ])
const studentListMenus = collectStudentListMenus(menuItems)

const selectedMenuKey = ref('')
const fields = reactive({}) // { [groupKey]: true | false }
const saving = ref(false)

async function onSelect() {
  const menuKey = selectedMenuKey.value
  for (const k of Object.keys(fields)) delete fields[k]

  const current = await loadSettings(menuKey)
  // Người dùng đã chọn menu khác trong lúc đang tải: bỏ kết quả cũ
  if (menuKey !== selectedMenuKey.value) return
  for (const g of groups) fields[g.key] = current?.[g.key] === true
}

async function save() {
  saving.value = true
  try {
    await saveSettings(selectedMenuKey.value, { ...fields })
    snackbar.trigger({ message: 'Saved.', color: 'success' })
  } catch (e) {
    snackbar.trigger({ message: e.message || 'Failed to save.', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.form-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 520px;
}

.label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.35rem;
}

select {
  padding: 0.45rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 15px;
  width: 100%;
}

.divider {
  border: none;
  border-top: 1px solid #f1f5f9;
  margin: 0;
}

.section-heading {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  cursor: pointer;
  font-size: 0.92rem;
  color: #334155;
}
.check-row input { cursor: pointer; accent-color: #0855e3; }

.actions { padding-top: 0.25rem; }
</style>
