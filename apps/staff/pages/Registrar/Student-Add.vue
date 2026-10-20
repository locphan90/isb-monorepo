<template>
  <div class="student-add-page">
    <div class="form-card">
      <div class="form-field">
        <label class="label">MSSV</label>
        <input v-model="mssv" placeholder="e.g. PSO23000123" />
      </div>

      <div class="divider" />

      <StudentProfileForm :model-value="objJson" />

      <div class="divider" />

      <div class="actions">
        <v-btn :loading="saving" :disabled="!mssv.trim()" @click="create">Create Student</v-btn>
      </div>
      <p v-if="feedback" class="feedback" :class="{ 'feedback--error': isError }">{{ feedback }}</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ title: 'Add Student — Registrar' })
 
const { createStudent } = useStudentData()
const snackbar = useSnackbarStore()
const { user } = storeToRefs(useUserStore())
 
const mssv = ref('')
const objJson = reactive({})
const saving = ref(false)
 
async function create() {
  if (!mssv.value.trim()) return
 
  saving.value = true
  try {
    // domain = domain đang chọn của người tạo, ghi vào cột `domain` của tbl_student
    await createStudent(mssv.value.trim(), { ...objJson }, user.value.domain)
    snackbar.trigger({ message: 'Student created.', color: 'success' })
    mssv.value = ''
    for (const k of Object.keys(objJson)) delete objJson[k]
  } catch (e) {
    snackbar.trigger({ message: e.message || 'Failed to create student.', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.student-add-page { max-width: 900px; }

.form-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field { display: flex; flex-direction: column; }
.label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.35rem;
}
.form-field input {
  padding: 0.45rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 15px;
  max-width: 320px;
}

.divider {
  border: none;
  border-top: 1px solid #f1f5f9;
  margin: 0;
}

.actions { padding-top: 0.25rem; }

.feedback {
  font-size: 0.95rem;
  color: #16a34a;
  margin: 0;
}
.feedback--error { color: #dc2626; }
</style>