<!--
  (xem data/repositories/subjectRepository.js).
  Danh sách này được dùng lại ở form Add/Edit sinh viên — thêm/sửa/xoá môn
-->
<template>
  <div class="subjects-page">
    <div class="form-card">
      <div class="section-heading">Required Subjects</div>

      <div class="subject-rows">
        <div v-for="(s, idx) in subjects" :key="idx" class="subject-row">
          <input v-model="s.code" placeholder="Abbreviation" class="code-input" />
          <input v-model="s.name" placeholder="Full name (e.g. Economics)" class="name-input" />
          <button class="remove-btn" title="Remove" @click="removeRow(idx)">×</button>
        </div>
        <p v-if="subjects.length === 0" class="empty">No subjects yet — add one below.</p>
      </div>

      <v-btn variant="text" @click="addRow">+ Add Subject</v-btn>

      <div class="divider" />

      <div class="actions">
        <v-btn :loading="saving" @click="save">Save</v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ title: 'Required Subjects' })

const { loadSubjects, saveSubjects } = useRequiredSubjects()
const snackbar = useSnackbarStore()

const subjects = reactive([])
const saving = ref(false)

onMounted(async () => {
  const list = await loadSubjects()
  subjects.splice(0, subjects.length, ...list.map((s) => ({ ...s })))
})

function addRow() {
  subjects.push({ code: '', name: '' })
}

function removeRow(idx) {
  subjects.splice(idx, 1)
}

async function save() {
  // Bỏ các dòng rỗng (chưa nhập gì) trước khi lưu
  const cleaned = subjects
    .map((s) => ({ code: s.code.trim(), name: s.name.trim() }))
    .filter((s) => s.code && s.name)

  saving.value = true
  try {
    await saveSubjects(cleaned)
    subjects.splice(0, subjects.length, ...cleaned.map((s) => ({ ...s })))
    snackbar.trigger({ message: 'Saved.', color: 'success' })
  } catch (e) {
    snackbar.trigger({ message: e.message || 'Failed to save.', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.subjects-page { max-width: 600px; }

.form-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-heading {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.subject-rows { display: flex; flex-direction: column; gap: 8px; }
.subject-row { display: flex; gap: 8px; align-items: center; }

.code-input { flex: 0 0 160px; }
.name-input { flex: 1; }
.code-input, .name-input {
  padding: 0.45rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 15px;
}

.remove-btn {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 1.1rem;
  cursor: pointer;
  border-radius: 6px;
}
.remove-btn:hover { background: #fee2e2; color: #dc2626; }

.empty { color: #94a3b8; font-size: 0.9rem; margin: 0; }

.divider {
  border: none;
  border-top: 1px solid #f1f5f9;
  margin: 0;
}

.actions { padding-top: 0.25rem; }
</style>