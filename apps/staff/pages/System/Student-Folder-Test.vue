<!--
  System > Student Folder Test (trang thử tạm)
  1) Tạo/tìm folder Drive của sinh viên: <thư mục gốc>/<năm>/<MSSV>_<họ tên không dấu> (Edge Function trên Supabase,
     gọi qua /api/student-folder).
  2) Upload file vào đúng folder đó (dùng lại Client_UploadToGoogleDrive).
-->
<template>
  <div class="folder-test">
    <div class="form-card">
      <div class="section-heading">1. Create / find student folder</div>

      <label class="check-row">
        <input v-model="useCustom" type="checkbox" />
        <span>Use a custom root folder (ID or Drive link)</span>
      </label>

      <template v-if="!useCustom">
        <div class="field-row">
          <div class="field">
            <label class="label">Domain</label>
            <select v-model="domainKey">
              <option v-for="d in domains" :key="d.domain" :value="d.domain">{{ d.domain }} — {{ d.name }}</option>
            </select>
          </div>
          <div class="field field--sm">
            <label class="label">Department folder</label>
            <select v-model="dept">
              <option v-for="[k] in deptOptions" :key="k" :value="k">{{ k }}</option>
            </select>
          </div>
        </div>
      </template>
      <div v-else class="field">
        <label class="label">Root folder ID or link</label>
        <input v-model="customRoot" placeholder="https://drive.google.com/drive/folders/..." autocomplete="off" />
      </div>

      <p class="hint">
        Root folder ID: <code>{{ rootFolderId || '—' }}</code>
      </p>

      <div class="field-row">
        <div class="field field--sm">
          <label class="label">Student ID (MSSV)</label>
          <input v-model="studentId" placeholder="e.g. WSU210001" autocomplete="off" />
        </div>
        <div class="field">
          <label class="label">Full name</label>
          <input v-model="fullName" placeholder="e.g. Nguyễn Văn An" autocomplete="off" />
        </div>
      </div>

      <div class="actions">
        <v-btn :loading="creating" :disabled="creating || !canCreate" @click="createFolder">
          Create / find folder
        </v-btn>
      </div>

      <div v-if="studentFolderId" class="result">
        <div class="label">Student folder ID</div>
        <div class="result-row">
          <code>{{ studentFolderId }}</code>
          <v-btn size="small" @click="copyId">Copy</v-btn>
          <a :href="folderUrl" target="_blank" rel="noopener">Open in Drive</a>
        </div>
      </div>
    </div>

    <div class="form-card">
      <div class="section-heading">2. Upload files to this folder</div>
      <p v-if="!studentFolderId" class="hint">Create or find a folder first.</p>

      <label
        class="upload-btn v-btn v-btn--variant-elevated v-theme--light text-none"
        :class="{ 'v-btn--disabled': !studentFolderId || uploading }"
        :style="{ pointerEvents: !studentFolderId || uploading ? 'none' : 'auto' }"
      >
        {{ uploading ? 'Uploading...' : 'Choose files' }}
        <input
          type="file"
          multiple
          :disabled="!studentFolderId || uploading"
          accept=".xls,.xlsx,.doc,.docx,image/*,application/pdf"
          @change="onFilesChange"
        />
      </label>

      <ul v-if="uploaded.length" class="uploaded">
        <li v-for="(f, i) in uploaded" :key="i" :class="{ failed: !f.url }">
          <template v-if="f.url">✅ <a :href="f.url" target="_blank" rel="noopener">{{ f.name }}</a></template>
          <template v-else>❌ {{ f.name }} — upload failed (see browser console)</template>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ title: 'Student Folder Test' })

const snackbar = useSnackbarStore()
const userStore = useUserStore()

// ── chọn thư mục gốc ──────────────────────────────────────────────────────────
// Chỉ lấy domain đã khai báo folder (WSU... có thể để trống)
const domains = arrDomain.filter((d) => Object.values(d.folderId || {}).some(Boolean))

const useCustom = ref(false)
const customRoot = ref('')
const domainKey = ref(
  domains.find((d) => d.domain === userStore.user?.domainInfo?.domain)?.domain ?? domains[0]?.domain ?? '',
)
const dept = ref('')

const deptOptions = computed(() => {
  const d = domains.find((x) => x.domain === domainKey.value)
  return Object.entries(d?.folderId || {}).filter(([, id]) => id)
})

watch(
  deptOptions,
  (opts) => {
    if (!opts.some(([k]) => k === dept.value)) dept.value = opts.find(([k]) => k === 'REG')?.[0] ?? opts[0]?.[0] ?? ''
  },
  { immediate: true },
)

const rootFolderId = computed(() => {
  if (useCustom.value) return extractFolderIdFromUrl(customRoot.value)
  return deptOptions.value.find(([k]) => k === dept.value)?.[1] ?? null
})

// ── tạo folder ────────────────────────────────────────────────────────────────
const studentId = ref('')
const fullName = ref('')
const creating = ref(false)
const studentFolderId = ref('')

const canCreate = computed(() => !!rootFolderId.value && !!studentId.value.trim() && !!fullName.value.trim())
const folderUrl = computed(() => `https://drive.google.com/drive/folders/${studentFolderId.value}`)

async function createFolder() {
  creating.value = true
  studentFolderId.value = ''
  uploaded.value = []
  try {
    const res = await $fetch('/api/student-folder', {
      method: 'POST',
      body: {
        studentId: studentId.value.trim(),
        fullName: fullName.value.trim(),
        rootFolderId: rootFolderId.value,
      },
    })
    studentFolderId.value = res.studentFolderId
    snackbar.trigger({ message: 'Folder ready.', color: 'success' })
  } catch (e) {
    const detail = e?.data?.data?.detail
    const message = [e?.data?.statusMessage || e?.message || 'Failed to create folder', detail].filter(Boolean).join(': ')
    snackbar.trigger({ message, color: 'error' })
  } finally {
    creating.value = false
  }
}

async function copyId() {
  try {
    await navigator.clipboard.writeText(studentFolderId.value)
    snackbar.trigger({ message: 'Copied.', color: 'success' })
  } catch {
    snackbar.trigger({ message: 'Could not copy. Select the ID and copy manually.', color: 'error' })
  }
}

// ── upload ────────────────────────────────────────────────────────────────────
const uploading = ref(false)
const uploaded = ref([]) // { name, url? }

async function onFilesChange(event) {
  const files = Array.from(event.target.files ?? [])
  event.target.value = '' // cho phép chọn lại cùng một file
  if (!files.length || !studentFolderId.value) return

  uploading.value = true
  try {
    for (const file of files) {
      // Client_UploadToGoogleDrive tự bắt lỗi và trả undefined khi thất bại
      const res = await Client_UploadToGoogleDrive(file, studentFolderId.value)
      uploaded.value.push(
        res?.fileId
          ? { name: res.fileName || file.name, url: `https://drive.google.com/file/d/${res.fileId}/view` }
          : { name: file.name, url: null },
      )
    }
    const ok = uploaded.value.filter((f) => f.url).length
    snackbar.trigger({ message: `${ok}/${uploaded.value.length} file(s) uploaded.`, color: ok === uploaded.value.length ? 'success' : 'warning' })
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.folder-test {
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.35rem;
}

.section-heading {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.field { display: flex; flex-direction: column; }
.field-row { display: flex; gap: 1rem; }
.field-row .field { flex: 1; }
.field-row .field--sm { flex: 1 1 0; min-width: 0; }

input[type='text'], input:not([type]), select {
  padding: 0.45rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 15px;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.92rem;
  color: #334155;
}
.check-row input { cursor: pointer; accent-color: #0855e3; }

.hint { margin: 0; font-size: 0.82rem; color: #64748b; }

.actions { display: flex; align-items: center; gap: 0.75rem; }

.result {
  border-top: 1px solid #f1f5f9;
  padding-top: 0.75rem;
}
.result-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; word-break: break-all; }

.upload-btn {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 0 16px;
  height: 36px;
  border-radius: 4px;
  background-color: rgb(var(--v-theme-primary));
  color: white;
  box-shadow: var(--v-shadow-2);
}
.upload-btn input[type='file'] { display: none; }

.uploaded { list-style: none; margin: 0; padding: 0; font-size: 0.9rem; display: flex; flex-direction: column; gap: 4px; }
.uploaded .failed { color: #b91c1c; }
</style>
