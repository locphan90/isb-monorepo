<!--
  apps/student/pages/profile.vue
  Trang sinh viên sau khi đăng nhập Google, gồm 3 phần (style theo StudentProfileDetail.vue):
    1. Thông tin chỉ xem  2. Import tài liệu (5 nút, chưa có chức năng)  3. Thông tin được phép sửa
  Trường nào hiện ở phần 1 / phần 3 do admin cấu hình ở System > Student Self-Edit (bên app staff).
-->
<script setup>
import { STUDENT_IMPORT_ITEMS } from '#core/data/schemas/studentSelfEdit'
import { displayName, formatValue, selectItems } from '#core/data/transformers/studentSelfEdit'

// Chặn truy cập đã làm ở middleware/auth.global.ts
definePageMeta({ layout: 'student' })

const {
  loading, saving, notRegistered, student, form, errors, fields, groupBlocks, hasChanges, notify, load, submit, signOut,
} = useStudentSelfProfile()

// Phần 1: Student ID (nếu có) + các trường admin cho xem
const infoItems = computed(() => {
  const s = student.value
  if (!s) return []
  const items = []
  if (s.studentId) items.push({ key: 'StudentID', label: 'Student ID', value: String(s.studentId) })
  for (const f of fields.value.readOnly) {
    items.push({ key: f.key, label: f.label, value: formatValue(s.profile?.[f.key], f.type) })
  }
  return items
})

const inputType = (type) => (type === 'date' ? 'date' : type === 'number' || type === 'currency' ? 'number' : 'text')

// Phần 2: chưa có chức năng, nối vào đây khi có thông tin
const onImport = (item) => notify(`Import for ${item.label} is not available yet.`, 'warning')

onMounted(load)
</script>

<template>
  <div class="student-detail">
    <p v-if="loading && !student" class="loading">Loading...</p>

    <!-- Phiên đăng nhập hợp lệ nhưng không còn khớp sinh viên nào -->
    <v-alert v-else-if="notRegistered" type="warning" variant="tonal">
      This Google account is not registered with ISB. Contact the Registrar, or sign in with a different account.
      <template #append>
        <v-btn variant="text" @click="signOut">Use another account</v-btn>
      </template>
    </v-alert>

    <template v-else-if="student">
      <div class="detail-header">
        <div>
          <h2>{{ displayName(student.fullName) }}</h2>
          <span class="mssv-badge">{{ student.mssv }}</span>
        </div>
      </div>

      <!-- 1. Thông tin chỉ xem -->
      <div class="detail-section">
        <h3>Student Information</h3>
        <div v-if="infoItems.length" class="field-grid">
          <div v-for="i in infoItems" :key="i.key" class="field-item">
            <span class="field-label">{{ i.label }}</span>
            <span class="field-value">{{ i.value }}</span>
          </div>
        </div>
        <!-- Thông tin chỉ xem nằm ngoài objProfile (Docs, English certificate...) theo cấu hình của admin -->
        <div v-for="b in groupBlocks" :key="b.path" class="group-block">
          <h4>{{ b.label }}</h4>
          <div class="field-grid">
            <div v-for="i in b.items" :key="i.key" class="field-item">
              <span class="field-label">{{ i.label }}</span>
              <span class="field-value">{{ i.value }}</span>
            </div>
          </div>
        </div>
        <p v-if="!infoItems.length && !groupBlocks.length" class="empty">No information to show.</p>
      </div>

      <!-- 2. Import tài liệu -->
      <div class="detail-section">
        <h3>Import Documents</h3>
        <div class="import-row">
          <v-btn v-for="item in STUDENT_IMPORT_ITEMS" :key="item.key" variant="outlined" @click="onImport(item)">
            <AppIcon :name="item.icon" :size="18" class="mr-1" />
            {{ item.label }}
          </v-btn>
        </div>
      </div>

      <!-- 3. Thông tin được phép sửa -->
      <div class="detail-section">
        <h3>Update Your Details</h3>
        <v-form v-if="fields.editable.length" @submit.prevent="submit">
          <div class="edit-grid">
            <template v-for="f in fields.editable" :key="f.key">
              <v-textarea
                v-if="f.textarea"
                v-model="form[f.key]" :label="f.label" :error-messages="errors[f.key]"
                rows="1" auto-grow hide-details="auto"
              />
              <v-select
                v-else-if="f.options"
                v-model="form[f.key]" :label="f.label" :items="selectItems(f, student.profile?.[f.key])"
                :error-messages="errors[f.key]" clearable hide-details="auto"
              />
              <v-text-field
                v-else
                v-model="form[f.key]" :label="f.label" :type="inputType(f.type)"
                :error-messages="errors[f.key]" hide-details="auto"
              />
            </template>
          </div>
          <v-btn type="submit" color="primary" class="mt-4" :loading="saving" :disabled="!hasChanges">
            Save changes
          </v-btn>
        </v-form>
        <p v-else class="empty">No fields are open for editing right now.</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.student-detail { max-width: 900px; }

.loading, .empty { color: #94a3b8; }

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 16px;
}
.detail-header h2 { margin: 0 0 4px; }
.mssv-badge {
  display: inline-block;
  background: #eef2ff;
  color: #3730a3;
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 6px;
}

.detail-section { margin-bottom: 22px; }
.detail-section h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  margin: 0 0 10px;
}
.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px 20px;
}
.group-block { margin-top: 16px; }
.group-block h4 {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 6px;
}
.field-item { display: flex; flex-direction: column; }
.field-label { font-size: 0.75rem; color: #94a3b8; }
.field-value { font-size: 0.92rem; color: #1e293b; }

.import-row { display: flex; gap: 8px; flex-wrap: wrap; }

.edit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px 20px;
}
</style>
