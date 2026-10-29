<!--
  pages/System/Student-Self-Edit.vue
  Setting: chọn thông tin sinh viên được xem / được sửa trên trang của họ.
    - General profile (objProfile): từng trường Hidden / View only / Editable
    - Other information (Docs, English certificate...): chỉ chọn theo NHÓM cha (Hidden / View only), không liệt kê trường con; không bao giờ sửa được
  Trường chưa chọn thì sinh viên không thấy và không bao giờ được gửi xuống trình duyệt.
-->
<script setup>
import { unref } from 'vue'
import { STUDENT_SELF_EDIT_MENU_KEY, STUDENT_SELF_EDIT_BUTTONS } from '#core/data/schemas/studentSelfEdit'

// app-header lấy tiêu đề từ route meta nên không đặt tiêu đề riêng trong trang
definePageMeta({ title: 'Setting - Student Self-Edit' })

const {
  loading, saving, search, filteredRows, filteredGroups, access, groupAccess,
  counts, hasChanges, groupSummary, setGroupAll, load, save,
} = useStudentSelfEditSetting()

onMounted(load)

// Trạng thái hiển thị của nhóm cha, suy ra từ các trường con (dữ liệu lưu vẫn theo từng trường):
// tất cả view -> 'view', tất cả hidden -> 'hidden', lẫn lộn (cấu hình cũ) -> null
function groupState(g) {
  const acc = unref(groupAccess)
  const vals = g.fields.map(f => acc[f.id])
  if (vals.length && vals.every(v => v === 'view')) return 'view'
  if (vals.every(v => v === 'hidden')) return 'hidden'
  return null
}

// Bấm lại nút đang chọn thì v-btn-toggle trả về undefined -> bỏ qua
const onGroupChange = (g, v) => { if (v) setGroupAll(g, v) }
</script>

<template>
  <div class="setting-page">
    <p class="hint">
      Choose what students can see and edit on their own page. Hidden fields are never sent to students.
      Edits are saved straight to the student record.
    </p>

    <div class="toolbar">
      <v-text-field
        v-model="search" label="Search field" density="compact" hide-details clearable
        style="max-width: 280px"
      />
      <span class="summary">
        {{ counts.edit }} editable, {{ counts.view }} view only, {{ counts.other }} other fields shown
      </span>
      <v-spacer />
      <PermBtn
        :menu-key="STUDENT_SELF_EDIT_MENU_KEY"
        :btn-key="STUDENT_SELF_EDIT_BUTTONS.SAVE"
        label="Save"
        color="primary"
        :disabled="!hasChanges"
        :loading="saving"
        @click="save"
      >
        Save
      </PermBtn>
    </div>

    <v-progress-linear v-if="loading" indeterminate />

    <h3 class="section-title">General profile</h3>
    <v-table density="compact" class="field-table">
      <colgroup><col class="col-field"><col></colgroup>
      <thead>
        <tr><th>Field</th><th>Student access</th></tr>
      </thead>
      <tbody>
        <tr v-for="r in filteredRows" :key="r.key">
          <td>
            <div class="f-label">{{ r.label }}</div>
            <div class="f-key">{{ r.key }}</div>
          </td>
          <td>
            <v-btn-toggle
              v-model="access[r.key]" mandatory density="compact" variant="outlined" divided color="primary"
            >
              <v-btn value="hidden" size="small">Hidden</v-btn>
              <v-btn value="view" size="small" :disabled="r.noView || r.alwaysShown">View only</v-btn>
              <v-btn value="edit" size="small" :disabled="r.noEdit">Editable</v-btn>
            </v-btn-toggle>
            <span v-if="r.noEdit" class="lock-note">
              {{ r.noView ? 'Internal data, never shared with students' : 'Students cannot edit this field' }}
            </span>
            <span v-else-if="r.alwaysShown" class="lock-note">
              Always shown at the top of the student page; choose Editable to let students correct it
            </span>
          </td>
        </tr>
        <tr v-if="!filteredRows.length && !loading">
          <td colspan="2" class="empty">No fields found.</td>
        </tr>
      </tbody>
    </v-table>

    <h3 class="section-title">Other information (view only)</h3>
    <p class="hint">
      Information outside the general profile (documents, English certificate, courses, scholarship).
      Choose which sections students can view; they can never edit them.
    </p>
    <v-table density="compact" class="field-table">
      <colgroup><col class="col-field"><col></colgroup>
      <thead>
        <tr><th>Field</th><th>Student access</th></tr>
      </thead>
      <tbody>
        <tr v-for="g in filteredGroups" :key="g.path">
          <td>
            <div class="f-label">{{ g.label }}</div>
            <div class="f-key">{{ g.path }} · {{ groupSummary(g) }}</div>
          </td>
          <td>
            <v-btn-toggle
              :model-value="groupState(g)"
              density="compact" variant="outlined" divided color="primary"
              @update:model-value="v => onGroupChange(g, v)"
            >
              <v-btn value="hidden" size="small">Hidden</v-btn>
              <v-btn value="view" size="small">View only</v-btn>
            </v-btn-toggle>
            <span v-if="groupState(g) === null" class="lock-note">
              Mixed: only some fields are shown. Choose an option to apply it to the whole section
            </span>
          </td>
        </tr>
        <tr v-if="!filteredGroups.length && !loading">
          <td colspan="2" class="empty">No fields found.</td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<style scoped>
.setting-page { width: 100%; }
.hint { color: #64748b; font-size: 0.9rem; margin: 0 0 12px; }
.toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
.summary { font-size: 0.85rem; color: #64748b; }
.section-title {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  margin: 20px 0 8px;
}
.field-table { width: 100%; }
/* Hai bảng dùng chung độ rộng cột: table-layout fixed + cột đầu cố định,
   nên cột Student access của bảng dưới lùi vào thẳng hàng với bảng trên
   (trước đây độ rộng cột tự co theo nội dung nên 2 bảng lệch nhau) */
.field-table :deep(table) { table-layout: fixed !important; width: 100% !important; }
.col-field { width: 28%; }
.f-label { font-size: 0.92rem; color: #1e293b; }
.f-key { font-size: 0.75rem; color: #94a3b8; }
.lock-note { margin-left: 12px; font-size: 0.75rem; color: #94a3b8; }
.empty { color: #94a3b8; text-align: center; }
td { padding-top: 6px !important; padding-bottom: 6px !important; }
</style>