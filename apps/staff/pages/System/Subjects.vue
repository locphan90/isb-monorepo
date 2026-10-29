<!--
  (xem data/repositories/subjectRepository.js).
  Danh sách này được dùng lại ở form Add/Edit sinh viên — thêm/sửa/xoá môn.
  Mỗi môn có: code, name, prg (PSO/Talent), major (ANY), domain (domain của
  người nhập — sinh viên sẽ theo domain để lấy danh sách môn).
-->
<template>
  <div class="subjects-page">
    <div class="form-card">
      <div class="section-heading">Required Subjects</div>
      <p class="domain-note">Domain: <strong>{{ domain || '—' }}</strong></p>

      <div class="subject-rows">
        <div v-for="(s, idx) in subjects" :key="idx" class="subject-row">
          <input v-model="s.code" placeholder="Abbreviation" class="code-input" />
          <input v-model="s.name" placeholder="Full name (e.g. Economics)" class="name-input" />
          <select v-model="s.prg" class="select-input prg-input">
            <option value="" disabled>PRG</option>
            <option v-for="p in prgOptions" :key="p" :value="p">{{ p }}</option>
          </select>
          <select v-model="s.major" class="select-input major-input">
            <option value="" disabled>Major</option>
            <option v-for="m in MAJOR_OPTIONS" :key="m" :value="m">{{ m }}</option>
          </select>
          <button class="remove-btn" title="Remove" @click="removeRow(idx)">×</button>
        </div>
        <p v-if="subjects.length === 0" class="empty">No subjects yet — add one below.</p>
      </div>

      <v-btn variant="text" @click="addRow">+ Add Subject</v-btn>

      <div class="divider" />

      <div class="actions">
        <v-btn :loading="saving" :disabled="!domain" @click="save">Save</v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ title: 'Required Subjects' })

// PRG phụ thuộc vào domain: MBA/EAP -> PSO/Talent, WSU -> BBUS/BCOMM/BDATA.
// Domain khác (vd ISP) chưa được quy định nên tạm cho chọn tất cả.
const PRG_BY_DOMAIN = {
  MBA: ['PSO', 'Talent'],
  EAP: ['PSO', 'Talent'],
  WSU: ['BBUS', 'BCOMM', 'BDATA'],
}
const ALL_PRG = [...new Set(Object.values(PRG_BY_DOMAIN).flat())]
const MAJOR_OPTIONS = ['ANY']

const { loadSubjects, getEditableSubjects, saveSubjects } = useRequiredSubjects()
const snackbar = useSnackbarStore()
// Domain của người đang đăng nhập (lấy từ user store).
// LƯU Ý: đổi `domain` thành đúng tên thuộc tính trong store của project nếu khác.
const { user } = storeToRefs(useUserStore())
const domain = computed(() => user.value.domain || '')
const prgOptions = computed(() => PRG_BY_DOMAIN[domain.value.toUpperCase()] ?? ALL_PRG)

const subjects = reactive([])
const saving = ref(false)

onMounted(async () => {
  await loadSubjects()
  const list = getEditableSubjects(domain.value)
  subjects.splice(0, subjects.length, ...list.map((s) => ({
    code: s.code,
    name: s.name,
    // PRG cũ không nằm trong danh sách của domain thì để trống, buộc chọn lại
    prg: prgOptions.value.includes(s.prg) ? s.prg : '',
    major: s.major || 'ANY',
  })))
})

function addRow() {
  // Mặc định Major = ANY; PRG để người dùng chọn
  subjects.push({ code: '', name: '', prg: '', major: 'ANY' })
}

function removeRow(idx) {
  subjects.splice(idx, 1)
}

async function save() {
  if (!domain.value) {
    snackbar.trigger({ message: 'Cannot determine your domain.', color: 'error' })
    return
  }

  // Bỏ các dòng rỗng (chưa nhập gì) trước khi lưu
  const cleaned = subjects
    .map((s) => ({
      code: s.code.trim(),
      name: s.name.trim(),
      prg: s.prg,
      major: s.major,
    }))
    .filter((s) => s.code && s.name)

  // Mỗi môn bắt buộc phải chọn PRG (đúng theo domain) và Major
  if (cleaned.some((s) => !prgOptions.value.includes(s.prg) || !s.major)) {
    snackbar.trigger({ message: 'Please select PRG and Major for every subject.', color: 'error' })
    return
  }

  saving.value = true
  try {
    await saveSubjects(cleaned, domain.value)
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
.subjects-page { max-width: 900px; }

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

.domain-note { margin: 0; font-size: 0.9rem; color: #475569; }

.subject-rows { display: flex; flex-direction: column; gap: 8px; }
.subject-row { display: flex; gap: 8px; align-items: center; }

.code-input { flex: 0 0 160px; }
.name-input { flex: 1; }
.prg-input { flex: 0 0 120px; }
.major-input { flex: 0 0 110px; }
.code-input, .name-input, .select-input {
  padding: 0.45rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 15px;
  background: #fff;
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