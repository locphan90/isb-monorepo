<template>
  <div class="user-mgmt">
    <div class="layout-grid">
      <div class="form-card">
        <!-- Chế độ sửa: chọn user có sẵn -->
        <div v-if="!creating" class="field">
          <div class="label-row">
            <label class="label">User</label>
            <v-btn size="small" @click="startCreate">+ New user</v-btn>
          </div>
          <AppCombobox
            v-model="selectedEmail"
            :options="users"
            @select="onUserSelect"
            @clear="onClear"
          />
        </div>

        <!-- Chế độ tạo mới: nhập email -->
        <div v-else class="field">
          <label class="label">New user email</label>
          <input v-model="newEmail" type="email" placeholder="" autocomplete="off" />
        </div>

        <template v-if="showForm">
          <div class="field-row">
            <div class="field">
              <label class="label">Name</label>
              <input v-model="form.role.Name" placeholder="" />
            </div>
          </div>
          <div class="field-row">
            <div class="field field--sm">
              <label class="label">Role</label>
              <select v-model="form.role.Rank">
                <option value="">— select —</option>
                <option v-for="r in availableRanks" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>
            <div class="field field--sm">
              <label class="label">Domain</label>
              <input v-model="form.role.Domain" placeholder="EAP or EAP,ISP" />
            </div>
          </div>

          <!-- Copy quyền từ user đã phân quyền sẵn (chỉ khi tạo mới) -->
          <template v-if="creating">
            <div class="divider" />
            <div class="section-heading">Copy permissions from</div>
            <AppCombobox
              v-model="copySourceEmail"
              :options="copySources"
              @select="onCopySelect"
              @clear="onCopyClear"
            />
            <label class="check-row">
              <input v-model="copyRoleToo" type="checkbox" :disabled="!copySource" @change="onCopyRoleToggle" />
              <span>Also copy Role and Domain</span>
            </label>
            <p v-if="copySource" class="hint">
              Permissions copied from {{ copySource.email }}. You can still adjust them on the right before creating.
            </p>
          </template>

          <div class="divider" />

          <div class="actions">
            <template v-if="creating">
              <v-btn :loading="saving" :disabled="saving" @click="createNewUser">Create User</v-btn>
              <v-btn :disabled="saving" @click="cancelCreate">Cancel</v-btn>
            </template>
            <v-btn v-else :loading="saving" :disabled="saving" @click="saveUser">Update</v-btn>
            <span class="spacer" />
            <v-btn
              v-if="isExistingUser && currentUser.i_status !== 1"
              :loading="saving"
              :disabled="saving"
              @click="retireUser"
            >
              Retire User
            </v-btn>
          </div>
        </template>
      </div>

      <!-- Cột riêng cho cây phân quyền — tách khỏi form thông tin bên trái để có
           đủ chỗ hiện menu/nút lồng nhiều cấp mà không bị bó hẹp. -->
      <div v-if="showForm" class="form-card permissions-card">
        <div class="section-heading">Permissions</div>
        <PermissionTree :permissions="form.permissions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { availableRanks } from '~/config/rights.js'
import * as userRepository from '~/data/repositories/userRepository.js'

const { user: sessionUser } = useUserSession()
const snackbar = useSnackbarStore()

// ── data ────────────────────────────────────────────────────────────────────
const users = ref([])
const selectedEmail = ref('')
const currentUser = ref(null)
const saving = ref(false)

const isExistingUser = computed(() => currentUser.value !== null)

// ── chế độ tạo user mới + copy quyền ─────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Khớp usePermission.js: rank này luôn thấy hết nên cây quyền của họ thường rỗng
const ADMIN_RANKS = ['SYS', 'SYSADMIN']

const creating = ref(false)
const newEmail = ref('')
const copySourceEmail = ref('') // chữ trong ô combobox
const copySource = ref(null) // user đã chọn làm nguồn copy
const copyRoleToo = ref(false)

const showForm = computed(() => creating.value || currentUser.value !== null)
// Chỉ lấy user còn hoạt động làm nguồn copy
const copySources = computed(() => users.value.filter((u) => u.i_status !== 1))

// ── form state ───────────────────────────────────────────────────────────────
const form = reactive({
  role: { Name: '', Rank: '', Domain: '' },
  permissions: {}, // cây phân quyền -> lưu vào arr_json.PERMISSIONS
})

// Ghi lại cây quyền từ `tree` (arr_json.PERMISSIONS), xoá hết key cũ trước.
// Giữ nguyên identity của object reactive để PermissionTree không mất liên kết.
function fillPermissions(tree) {
  for (const k of Object.keys(form.permissions)) delete form.permissions[k]
  if (!tree) return
  for (const [menuKey, entry] of Object.entries(tree)) {
    form.permissions[menuKey] = {
      menu: entry.menu === true,
      buttons: { ...(entry.buttons || {}) },
    }
  }
}

function resetForm() {
  form.role = { Name: '', Rank: '', Domain: '' }
  fillPermissions(null)
}

// ── fetch ─────────────────────────────────────────────────────────────────────
async function loadUsers() {
  users.value = await userRepository.fetchUsers()
}

onMounted(loadUsers)

// ── combobox events ───────────────────────────────────────────────────────────
function onUserSelect(u) {
  currentUser.value = u
  resetForm()

  if (u.obj_json) {
    form.role = {
      Name: u.obj_json.Name || '',
      Rank: u.obj_json.Rank || '',
      Domain: u.obj_json.Domain || '',
    }
  }

  fillPermissions(u.arr_json?.PERMISSIONS)
}

function onClear() {
  currentUser.value = null
  resetForm()
}

// ── tạo user mới / copy quyền ─────────────────────────────────────────────────
function resetCopy() {
  copySourceEmail.value = ''
  copySource.value = null
  copyRoleToo.value = false
}

function startCreate() {
  creating.value = true
  currentUser.value = null
  selectedEmail.value = ''
  newEmail.value = ''
  resetCopy()
  resetForm()
}

function cancelCreate() {
  creating.value = false
  newEmail.value = ''
  resetCopy()
  resetForm()
}

function copyRoleFrom(src) {
  form.role.Rank = src.obj_json?.Rank || ''
  form.role.Domain = src.obj_json?.Domain || ''
}

function onCopySelect(src) {
  copySource.value = src
  fillPermissions(src.arr_json?.PERMISSIONS)
  if (copyRoleToo.value) copyRoleFrom(src)

  if (Object.keys(form.permissions).length === 0) {
    const hint = ADMIN_RANKS.includes(src.obj_json?.Rank)
      ? ' Its Role already grants full access, so tick "Also copy Role and Domain".'
      : ''
    snackbar.trigger({ message: `${src.email} has no permissions to copy.${hint}`, color: 'warning' })
  }
}

function onCopyClear() {
  copySource.value = null
  fillPermissions(null)
  if (copyRoleToo.value) {
    form.role.Rank = ''
    form.role.Domain = ''
  }
  copyRoleToo.value = false
}

function onCopyRoleToggle() {
  if (!copySource.value) return
  if (copyRoleToo.value) {
    copyRoleFrom(copySource.value)
  } else {
    form.role.Rank = ''
    form.role.Domain = ''
  }
}

async function createNewUser() {
  const email = newEmail.value.trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    setFeedback('Please enter a valid email.', true)
    return
  }
  if (users.value.some((u) => u.email.trim().toLowerCase() === email)) {
    setFeedback('This email already exists.', true)
    return
  }

  saving.value = true

  const payload = {
    email,
    role: { Name: form.role.Name.trim(), Rank: form.role.Rank, Domain: form.role.Domain.trim() },
    permissions: { ...form.permissions },
    lastUser: sessionUser.value?.email ?? null,
  }

  try {
    await userRepository.createUser(payload)
    await loadUsers()

    creating.value = false
    newEmail.value = ''
    resetCopy()

    // Chuyển sang chế độ sửa user vừa tạo
    const created = users.value.find((u) => u.email.trim().toLowerCase() === email)
    if (created) {
      selectedEmail.value = created.email
      onUserSelect(created)
    }
    setFeedback('User created.', false)
  } catch (e) {
    setFeedback(e.message, true)
  } finally {
    saving.value = false
  }
}

// ── save (sửa) / retire ───────────────────────────────────────────────────────
async function saveUser() {
  saving.value = true

  const payload = {
    email: selectedEmail.value.trim(),
    role: { Name: form.role.Name.trim(), Rank: form.role.Rank, Domain: form.role.Domain.trim() },
    permissions: { ...form.permissions },
    lastUser: sessionUser.value?.email ?? null,
  }

  try {
    await userRepository.updateUser(currentUser.value.id, payload)
    setFeedback('User updated.', false)
    await loadUsers()
  } catch (e) {
    setFeedback(e.message, true)
  } finally {
    saving.value = false
  }
}

async function retireUser() {
  if (!confirm(`Retire ${currentUser.value.email}? This will disable their access.`)) return

  saving.value = true

  try {
    await userRepository.retireUser(currentUser.value.id, sessionUser.value?.email ?? null)
    setFeedback('User retired.', false)
    await loadUsers()
    currentUser.value = { ...currentUser.value, i_status: 1 }
  } catch (e) {
    setFeedback(e.message, true)
  } finally {
    saving.value = false
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────
function setFeedback(message, error) {
  snackbar.trigger({ message, color: error ? 'error' : 'success' })
}
</script>

<style scoped>
.user-mgmt { max-width: 1180px; }

.layout-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 1rem;
  align-items: start;
}
@media (max-width: 900px) {
  .layout-grid { grid-template-columns: 1fr; }
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

.permissions-card { min-height: 100%; }

.label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.35rem;
}

.field { display: flex; flex-direction: column; }

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.35rem;
}
.label-row .label { margin-bottom: 0; }

.check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.92rem;
  color: #334155;
}
.check-row input { cursor: pointer; accent-color: #0855e3; }

.hint {
  margin: 0;
  font-size: 0.82rem;
  color: #64748b;
}

.field-row {
  display: flex;
  gap: 1rem;
}

.field-row .field { flex: 1; }
.field-row .field--sm { flex: 1 1 0; min-width: 0; }

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

.actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.25rem;
}
.spacer { flex: 1; }

input, select {
  padding: 0.45rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 15px;
}
</style>