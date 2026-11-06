<!--
  Academic Admin > Rates
  Nhập Rate theo loại môn vào tbl_misc (cat = 'RATE'), domain = domain đang chọn của user.
  Mỗi dòng là một giai đoạn (Valid From / Valid Thru dạng quý, vd 2026Q4); cùng loại môn các giai đoạn không chồng nhau.
  Dữ liệu đi qua /api/rate (server kiểm tra quyền menu + nút save/delete và domain của user).
-->
<template>
  <div class="rate-page">
    <!-- ── Form thêm Rate ─────────────────────────────────────────────── -->
    <div class="form-card native-fields">
      <v-row>
        <v-col cols="12" md="3"><v-select v-model="form.subjectType" :items="RATE_SUBJECT_TYPES" label="Subject type" /></v-col>
        <v-col cols="12" md="3"><v-text-field v-model.number="form.rate" type="number" min="0" label="Rate" /></v-col>
        <v-col cols="6" md="3"><v-select v-model="form.validFrom" :items="quarterOptions" label="Valid From" /></v-col>
        <v-col cols="6" md="3"><v-select v-model="form.validThru" :items="thruOptions" label="Valid Thru" clearable /></v-col>
      </v-row>

      <p class="hint">
        Periods are quarters (e.g. 2026Q4). Valid Thru must be later than Valid From; leave it empty if there is no end yet.
        Periods of the same subject type must not overlap.
      </p>

      <div class="divider" />

      <div class="actions">
        <PermBtn
          :menu-key="RATE_MENU_KEY"
          :btn-key="RATE_BUTTONS.SAVE"
          label="Add rate"
          :loading="saving"
          :disabled="!domain"
          @click="create"
        >Add Rate</PermBtn>
        <v-btn variant="text" @click="clearForm">Reset</v-btn>
        <span class="hint">Domain: <strong>{{ domain || '—' }}</strong></span>
      </div>
    </div>

    <!-- ── Danh sách Rate ────────────────────────────────────────────── -->
    <div class="form-card">
      <div class="section-head">
        <span class="label">Rates of {{ domain || '—' }} ({{ rates.length }})</span>
        <v-btn variant="text" :loading="loading" @click="load">Reload</v-btn>
      </div>

      <v-progress-linear v-if="loading" indeterminate />
      <p v-else-if="!rates.length" class="hint">No rates yet for this domain.</p>

      <div v-else class="table-wrap">
        <table class="rates">
          <thead>
            <tr>
              <th>Subject type</th><th class="num">Rate</th><th>Valid From</th><th>Valid Thru</th>
              <th>Status</th><th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rates" :key="r.id">
              <td>{{ r.subjectType }}</td>
              <td class="num">{{ formatAmount(r.rate) }}</td>
              <td>{{ r.validFrom }}</td>
              <td>{{ r.validThru || '—' }}</td>
              <td>{{ rateStatus(r, today) }}</td>
              <td class="col-actions">
                <PermBtn
                  :menu-key="RATE_MENU_KEY"
                  :btn-key="RATE_BUTTONS.DELETE"
                  label="Delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="askDelete(r)"
                >Delete</PermBtn>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Xác nhận xóa ──────────────────────────────────────────────── -->
    <v-dialog v-model="deleteDialog" max-width="440">
      <v-card>
        <v-card-title>Delete rate?</v-card-title>
        <v-card-text>
          {{ deleteTarget?.subjectType }} · {{ formatAmount(deleteTarget?.rate) }} ·
          {{ deleteTarget?.validFrom }} → {{ deleteTarget?.validThru || 'no end' }} will be removed from the list.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="deleting" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { RATE_MENU_KEY, RATE_BUTTONS, RATE_SUBJECT_TYPES, emptyRateForm } from '~/data/schemas/rateSchema'
import { formatAmount, rateStatus } from '~/data/transformers/rateTransformer'
import { buildQuarterOptions } from '~/data/transformers/subjectTransformer'

definePageMeta({ title: 'Rates — Academic Admin' })

const { fetchRates, createRate, deleteRate } = useRate()
const snackbar = useSnackbarStore()
const { user } = storeToRefs(useUserStore())

const domain = computed(() => user.value.domain)

const form = reactive(emptyRateForm())
const rates = ref([])
const loading = ref(false)
const saving = ref(false)

// "Hôm nay" theo giờ Việt Nam, dạng YYYY-MM-DD
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })

// Quý để chọn: từ quý hiện tại, đủ 2 năm; Valid Thru chỉ cho chọn quý sau Valid From
const quarterOptions = buildQuarterOptions(today)
const thruOptions = computed(() => quarterOptions.filter((q) => !form.validFrom || q > form.validFrom))
watch(() => form.validFrom, (from) => {
  if (form.validThru && from && form.validThru <= from) form.validThru = ''
})

const clearForm = () => Object.assign(form, emptyRateForm())

async function load() {
  if (!domain.value) return
  loading.value = true
  try {
    rates.value = await fetchRates(domain.value)
  } catch (e) {
    snackbar.trigger({ message: e.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

// Đổi domain thì tải lại danh sách theo domain mới
watch(domain, () => {
  rates.value = []
  load()
}, { immediate: true })

async function create() {
  saving.value = true
  try {
    await createRate(domain.value, form, rates.value)
    snackbar.trigger({ message: 'Rate added.', color: 'success' })
    clearForm()
    await load()
  } catch (e) {
    snackbar.trigger({ message: e.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

// ── Xóa ──
const deleteDialog = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)

function askDelete(r) {
  deleteTarget.value = r
  deleteDialog.value = true
}

async function confirmDelete() {
  deleting.value = true
  try {
    await deleteRate(domain.value, deleteTarget.value.id)
    snackbar.trigger({ message: 'Rate deleted.', color: 'success' })
    deleteDialog.value = false
    await load()
  } catch (e) {
    snackbar.trigger({ message: e.message, color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.rate-page { max-width: 1000px; display: flex; flex-direction: column; gap: 1rem; }

.form-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.label { font-size: 0.9rem; font-weight: 600; color: #64748b; }
.hint { font-size: 0.8rem; color: #64748b; }
.section-head { display: flex; align-items: center; justify-content: space-between; }
.divider { border: none; border-top: 1px solid #f1f5f9; margin: 0; }
.actions { display: flex; align-items: center; gap: 0.5rem; }

.table-wrap { overflow-x: auto; }
table.rates { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
table.rates th {
  text-align: left; font-size: 0.8rem; font-weight: 600; color: #64748b;
  padding: 0.5rem 0.75rem; border-bottom: 1px solid #e2e8f0; white-space: nowrap;
}
table.rates td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #f1f5f9; }
.num { text-align: right; }
.col-actions { white-space: nowrap; text-align: right; }
</style>
