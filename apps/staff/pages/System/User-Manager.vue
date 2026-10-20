<template>
  <div class="user-mgmt">
    <div class="layout-grid">
      <div class="form-card">
        <!-- User selector -->
        <div class="field">
          <label class="label">User</label>
          <AppCombobox
            v-model="selectedEmail"
            :options="users"
            @select="onUserSelect"
            @clear="onClear"
          />
        </div>

        <template v-if="selectedEmail">
          <div class="field-row">
            <div class="field">
              <label class="label">Name</label>
              <input v-model="form.role.Name" placeholder="e.g. Ke Toan" />
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
              <input v-model="form.role.Domain" placeholder="e.g. EAP or EAP,ISP" />
            </div>
          </div>

          <div class="divider" />

          <div class="actions">
            <v-btn :loading="saving" :disabled="saving" @click="saveUser">
              {{ isExistingUser ? 'Update' : 'Create User' }}
            </v-btn>
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
      <div v-if="selectedEmail" class="form-card permissions-card">
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

// ── form state ───────────────────────────────────────────────────────────────
const form = reactive({
  role: { Name: '', Rank: '', Domain: '' },
  permissions: {}, // cây phân quyền -> lưu vào arr_json.PERMISSIONS
})

function resetForm() {
  form.role = { Name: '', Rank: '', Domain: '' }
  // xoá hết key cũ trong object reactive (giữ nguyên identity object cho PermissionTree)
  for (const k of Object.keys(form.permissions)) delete form.permissions[k]
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

  const tree = u.arr_json?.PERMISSIONS
  if (tree) {
    for (const [menuKey, entry] of Object.entries(tree)) {
      form.permissions[menuKey] = {
        menu: entry.menu === true,
        buttons: { ...(entry.buttons || {}) },
      }
    }
  }
}

function onClear() {
  currentUser.value = null
  resetForm()
}

// ── save / retire ─────────────────────────────────────────────────────────────
async function saveUser() {
  saving.value = true

  const payload = {
    email: selectedEmail.value.trim(),
    role: { Name: form.role.Name.trim(), Rank: form.role.Rank, Domain: form.role.Domain.trim() },
    permissions: { ...form.permissions },
    lastUser: sessionUser.value?.email ?? null,
  }

  try {
    if (isExistingUser.value) {
      await userRepository.updateUser(currentUser.value.id, payload)
    } else {
      await userRepository.createUser(payload)
    }

    setFeedback(isExistingUser.value ? 'User updated.' : 'User created.', false)
    await loadUsers()
    if (!isExistingUser.value) {
      const created = users.value.find((u) => u.email === payload.email)
      if (created) onUserSelect(created)
    }
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