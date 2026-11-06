<!--
  Academic Admin > Subjects
  Nhập môn học vào tbl_subject (domain = domain đang chọn của user), xem danh sách môn của domain đó,
  xóa mềm, và nhập học phí theo nhiều giai đoạn (Fee, Retake Fee, Valid From, Valid Thru) vào arr_json.
  Dữ liệu đi qua /api/subject (server kiểm tra quyền menu + nút save/fees/delete và domain của user).
-->
<template>
  <div class="subject-page">
    <!-- ── Form thêm môn ─────────────────────────────────────────────── -->
    <div class="form-card native-fields">
      <!-- Cả 6 ô nằm trên một hàng (màn hình hẹp tự xuống 3 rồi 2 ô một hàng) -->
      <div class="fields-row">
        <v-text-field v-model="form.subjCode" label="Subject code" :maxlength="SUBJECT_CODE_MAX" />
        <v-text-field v-model="form.subjName" label="Subject name" :maxlength="SUBJECT_TEXT_MAX" class="wide" />
        <v-text-field v-model="form.code" label="Code" :maxlength="SUBJECT_TEXT_MAX" />
        <v-select v-model="form.type" :items="SUBJECT_TYPES" label="Type" />
        <v-select v-model="form.stage" :items="SUBJECT_STAGES" label="Stage" />
        <!-- Gợi ý theo domain nhưng vẫn nhập tay được -->
        <v-combobox
          v-model="form.prg"
          :items="programOptions"
          label="Program"
          :hint="programOptions.length ? '' : 'Type the program for this domain'"
        />
      </div>

      <div class="divider" />

      <div class="actions">
        <PermBtn
          :menu-key="SUBJECT_MENU_KEY"
          :btn-key="SUBJECT_BUTTONS.SAVE"
          label="Add subject"
          :loading="saving"
          :disabled="!domain"
          @click="create"
        >Add Subject</PermBtn>
        <v-btn variant="text" @click="clearForm">Reset</v-btn>
        <span class="hint">Domain: <strong>{{ domain || '—' }}</strong></span>
      </div>
    </div>

    <!-- ── Danh sách môn đã nhập ─────────────────────────────────────── -->
    <div class="form-card">
      <div class="section-head">
        <span class="label">Subjects of {{ domain || '—' }} ({{ subjects.length }})</span>
        <v-btn variant="text" :loading="loading" @click="load">Reload</v-btn>
      </div>

      <v-progress-linear v-if="loading" indeterminate />
      <p v-else-if="!subjects.length" class="hint">No subjects yet for this domain.</p>

      <div v-else class="table-wrap">
        <table class="subjects">
          <thead>
            <tr>
              <th>Subject code</th><th>Subject name</th><th>Code</th><th>Type</th><th>Stage</th>
              <th>Program</th><th>Current fee</th><th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in subjects" :key="s.id">
              <td>{{ s.subjCode }}</td>
              <td>{{ s.subjName }}</td>
              <td>{{ s.code || '—' }}</td>
              <td>{{ s.type }}</td>
              <td>{{ s.stage }}</td>
              <td>{{ s.prg }}</td>
              <td>
                <template v-if="currentFee(s)">
                  {{ formatAmount(currentFee(s).Fee) }}
                  <span class="hint">/ retake {{ formatAmount(currentFee(s).RetakeFee) }}</span>
                </template>
                <span v-else class="hint">{{ s.fees.length ? 'No fee in effect today' : 'Not set' }}</span>
                <div v-if="s.fees.length" class="hint">{{ s.fees.length }} period{{ s.fees.length === 1 ? '' : 's' }}</div>
              </td>
              <td class="col-actions">
                <PermBtn
                  :menu-key="SUBJECT_MENU_KEY"
                  :btn-key="SUBJECT_BUTTONS.FEES"
                  label="Fees"
                  size="small"
                  variant="tonal"
                  @click="openFees(s)"
                >Fees</PermBtn>
                <PermBtn
                  :menu-key="SUBJECT_MENU_KEY"
                  :btn-key="SUBJECT_BUTTONS.DELETE"
                  label="Delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="askDelete(s)"
                >Delete</PermBtn>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Nhập học phí (nhiều giai đoạn) ─────────────────────────────── -->
    <v-dialog v-model="feeDialog" max-width="980" persistent>
      <v-card class="native-fields">
        <v-card-title>Fees — {{ feeTarget?.subjCode }} · {{ feeTarget?.subjName }}</v-card-title>
        <v-card-text>
          <p class="hint">Each period has its own fees. Periods are quarters (e.g. 2026Q4). Valid Thru must be later than Valid From and periods must not overlap; leave Valid Thru empty if there is no end yet.</p>
          <p v-if="!feePeriods.length" class="hint">No periods yet. Click "Add period".</p>

          <v-row v-for="(p, i) in feePeriods" :key="i" align="center" class="fee-row">
            <v-col cols="6" md="2"><v-text-field v-model.number="p.Fee" type="number" min="0" label="Fee" /></v-col>
            <v-col cols="6" md="2"><v-text-field v-model.number="p.RetakeFee" type="number" min="0" label="Retake Fee" /></v-col>
            <v-col cols="6" md="3"><v-select v-model="p.ValidFrom" :items="quarterItems(p.ValidFrom)" label="Valid From" /></v-col>
            <v-col cols="6" md="3">
              <v-select v-model="p.ValidThru" :items="thruItems(p)" label="Valid Thru" clearable />
            </v-col>
            <v-col cols="12" md="2" class="fee-remove">
              <v-btn size="small" variant="text" color="error" @click="removePeriod(i)">Remove</v-btn>
            </v-col>
          </v-row>

          <v-btn variant="tonal" class="mt-2" @click="addPeriod">Add period</v-btn>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="savingFees" @click="feeDialog = false">Cancel</v-btn>
          <v-btn :loading="savingFees" @click="saveFees">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Xác nhận xóa ──────────────────────────────────────────────── -->
    <v-dialog v-model="deleteDialog" max-width="440">
      <v-card>
        <v-card-title>Delete subject?</v-card-title>
        <v-card-text>
          {{ deleteTarget?.subjCode }} · {{ deleteTarget?.subjName }} ({{ deleteTarget?.prg }}) will be removed from the list.
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
import {
  SUBJECT_MENU_KEY, SUBJECT_BUTTONS, SUBJECT_TYPES, SUBJECT_STAGES, PROGRAMS_BY_DOMAIN,
  SUBJECT_CODE_MAX, SUBJECT_TEXT_MAX, emptySubjectForm, emptyFeePeriod,
} from '~/data/schemas/subjectSchema'
import { currentFeePeriod, formatAmount, toFeeForm, buildQuarterOptions } from '~/data/transformers/subjectTransformer'

definePageMeta({ title: 'Subjects — Academic Admin' })

const { fetchSubjects, createSubject, deleteSubject, saveFees: saveFeesApi } = useSubjectAdmin()
const snackbar = useSnackbarStore()
const { user } = storeToRefs(useUserStore())

const domain = computed(() => user.value.domain)
const programOptions = computed(() => PROGRAMS_BY_DOMAIN[domain.value] || [])

const form = reactive(emptySubjectForm())
const subjects = ref([])
const loading = ref(false)
const saving = ref(false)

// "Hôm nay" theo giờ Việt Nam, dạng YYYY-MM-DD
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
const currentFee = (s) => currentFeePeriod(s.fees, today)

const clearForm = () => Object.assign(form, emptySubjectForm())

async function load() {
  if (!domain.value) return
  loading.value = true
  try {
    subjects.value = await fetchSubjects(domain.value)
  } catch (e) {
    snackbar.trigger({ message: e.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

// Đổi domain: bỏ Program đang nhập (gợi ý khác nhau theo domain) và tải lại danh sách
watch(domain, () => {
  form.prg = null
  subjects.value = []
  load()
}, { immediate: true })

async function create() {
  saving.value = true
  try {
    await createSubject(domain.value, form)
    snackbar.trigger({ message: `Subject ${form.subjCode.trim()} added.`, color: 'success' })
    clearForm()
    await load()
  } catch (e) {
    snackbar.trigger({ message: e.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

// ── Học phí ──
const feeDialog = ref(false)
const feeTarget = ref(null)
const feePeriods = ref([])
const savingFees = ref(false)

function openFees(s) {
  feeTarget.value = s
  feePeriods.value = toFeeForm(s.fees)
  feeDialog.value = true
}
// Quý để chọn: từ quý hiện tại, đủ 2 năm; giữ thêm giá trị đã lưu (có thể là quý đã qua) để vẫn hiện đúng khi sửa
const baseQuarters = buildQuarterOptions(today)
const quarterItems = (current) =>
  current && !baseQuarters.includes(current) ? [current, ...baseQuarters].sort() : baseQuarters
// Valid Thru chỉ cho chọn quý sau Valid From
const thruItems = (p) => quarterItems(p.ValidThru).filter((q) => !p.ValidFrom || q > p.ValidFrom)
watch(feePeriods, (list) => {
  list.forEach((p) => { if (p.ValidThru && p.ValidFrom && p.ValidThru <= p.ValidFrom) p.ValidThru = '' })
}, { deep: true })
const addPeriod = () => feePeriods.value.push(emptyFeePeriod())
const removePeriod = (i) => feePeriods.value.splice(i, 1)

async function saveFees() {
  savingFees.value = true
  try {
    await saveFeesApi(domain.value, feeTarget.value.id, feePeriods.value)
    snackbar.trigger({ message: 'Fees saved.', color: 'success' })
    feeDialog.value = false
    await load()
  } catch (e) {
    snackbar.trigger({ message: e.message, color: 'error' })
  } finally {
    savingFees.value = false
  }
}

// ── Xóa ──
const deleteDialog = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)

function askDelete(s) {
  deleteTarget.value = s
  deleteDialog.value = true
}

async function confirmDelete() {
  deleting.value = true
  try {
    await deleteSubject(domain.value, deleteTarget.value.id)
    snackbar.trigger({ message: 'Subject deleted.', color: 'success' })
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
.subject-page { max-width: 1200px; display: flex; flex-direction: column; gap: 1rem; }

.fields-row {
  display: grid;
  grid-template-columns: 1.2fr 2.4fr 1fr 1.2fr 0.9fr 1.4fr;
  gap: 12px;
  align-items: start;
}
@media (max-width: 1100px) {
  .fields-row { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .fields-row .wide { grid-column: span 2; }
}
@media (max-width: 600px) {
  .fields-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .fields-row .wide { grid-column: span 2; }
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

.label { font-size: 0.9rem; font-weight: 600; color: #64748b; }
.hint { font-size: 0.8rem; color: #64748b; }
.section-head { display: flex; align-items: center; justify-content: space-between; }
.divider { border: none; border-top: 1px solid #f1f5f9; margin: 0; }
.actions { display: flex; align-items: center; gap: 0.5rem; }

.table-wrap { overflow-x: auto; }
table.subjects { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
table.subjects th {
  text-align: left; font-size: 0.8rem; font-weight: 600; color: #64748b;
  padding: 0.5rem 0.75rem; border-bottom: 1px solid #e2e8f0; white-space: nowrap;
}
table.subjects td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
.col-actions { white-space: nowrap; text-align: right; }

/* Hộp thoại Fees: chừa khoảng trống phía trên để nhãn nổi của ô đầu tiên không đè lên dòng gợi ý */
.fee-hint { margin-bottom: 1rem; }
.fee-row { margin-bottom: 0.25rem; }
.fee-remove { text-align: right; }
</style>
