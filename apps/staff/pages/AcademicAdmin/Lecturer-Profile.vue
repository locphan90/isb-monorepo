<template>
  <div class="lecturer-page">
    <div class="form-card native-fields">
      <v-autocomplete
        v-model="selectedId"
        :items="lecturerOptions"
        item-title="name"
        item-value="id"
        label="Edit existing lecturer (leave empty to add new)"
        clearable
        class="select-existing"
      />

      <div class="divider" />

      <v-row>
        <v-col cols="12" md="6"><v-text-field v-model="form.FullName" label="Full Name" /></v-col>
        <v-col cols="6" md="3"><v-text-field v-model="form.DOB" type="date" label="DOB" /></v-col>
        <v-col cols="6" md="3"><v-text-field v-model="form.PhoneNo" label="Phone No" /></v-col>

        <v-col cols="6" md="3"><v-text-field v-model="form.IDNo" label="ID No" /></v-col>
        <v-col cols="6" md="3"><v-text-field v-model="form.DOI" type="date" label="DOI" /></v-col>
        <v-col cols="12" md="6">
          <!-- Email là khóa của tbl_lecturer nên khóa lại khi đang sửa -->
          <v-text-field v-model="form.Email" label="Email" :readonly="!!selectedId" />
        </v-col>

        <v-col cols="6" md="3"><v-text-field v-model="form.Nationality" label="Nationality" /></v-col>
        <v-col cols="6" md="3">
          <v-select v-model="form.HighestDegree" :items="DEGREES" label="Highest Degree" clearable />
        </v-col>
        <v-col cols="6" md="3"><v-text-field v-model="form.Major" label="Major" /></v-col>
        <v-col cols="6" md="3"><v-text-field v-model="form.TaxNo" label="Tax No" /></v-col>

        <v-col cols="6" md="3">
          <v-select v-model="form.PITRate" :items="PIT_RATES" label="PIT Rate" clearable />
        </v-col>
        <v-col cols="6" md="3"><v-text-field v-model="form.BankAccount" label="Bank Account" /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="form.BankName" label="Bank Name/Branch" /></v-col>

        <v-col cols="12" md="6"><v-text-field v-model="form.ContractNo" label="Contract No" /></v-col>
        <v-col cols="6" md="3"><v-text-field v-model="form.ContractStart" type="date" label="Contract Start" /></v-col>
        <v-col cols="6" md="3"><v-text-field v-model="form.ContractEnd" type="date" label="Contract End" /></v-col>

        <v-col cols="6" md="3">
          <v-select v-model="form.Type" :items="LECTURER_TYPES" label="Type" clearable />
        </v-col>
        <v-col cols="6" md="3">
          <v-select v-model="form.PaymentTerm" :items="PAYMENT_TERMS" label="Payment Term" clearable />
        </v-col>
        <v-col cols="6" md="3">
          <v-select v-model="form.SocialInsurance" :items="SOCIAL_INSURANCE" label="Social Insurance" clearable />
        </v-col>
      </v-row>

      <div class="divider" />

      <div class="actions">
        <v-btn :loading="saving" @click="save">{{ selectedId ? 'Update Lecturer' : 'Create Lecturer' }}</v-btn>
        <v-btn variant="text" @click="clearForm">Reset</v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  DEGREES, PIT_RATES, LECTURER_TYPES, PAYMENT_TERMS, SOCIAL_INSURANCE, emptyLecturerProfile
} from '~/data/schemas/lecturerSchema'

definePageMeta({ title: 'Lecturer Profile — Academic Admin' })

const { fetchLecturers, fetchLecturer, saveLecturer } = useLecturerData()
const snackbar = useSnackbarStore()

const form = reactive(emptyLecturerProfile())
const lecturerOptions = ref([])
const selectedId = ref(null) // null = thêm mới, có giá trị = đang sửa
const saving = ref(false)

async function loadOptions() {
  try {
    lecturerOptions.value = await fetchLecturers()
  } catch (e) {
    snackbar.trigger({ message: e.message || 'Failed to load lecturers.', color: 'error' })
  }
}

function clearForm() {
  Object.assign(form, emptyLecturerProfile())
  selectedId.value = null
}

// Chọn giảng viên có sẵn -> nạp vào form; bỏ chọn -> form trống
watch(selectedId, async (id) => {
  if (!id) { Object.assign(form, emptyLecturerProfile()); return }
  try {
    Object.assign(form, await fetchLecturer(id))
  } catch (e) {
    snackbar.trigger({ message: e.message || 'Failed to load lecturer.', color: 'error' })
  }
})

async function save() {
  saving.value = true
  try {
    await saveLecturer({ ...form }, selectedId.value) // người lưu lấy từ session ở server
    snackbar.trigger({ message: 'Lecturer saved.', color: 'success' })
    clearForm()
    await loadOptions()
  } catch (e) {
    snackbar.trigger({ message: e.message || 'Failed to save lecturer.', color: 'error' })
  } finally {
    saving.value = false
  }
}

onMounted(loadOptions)
</script>

<style scoped>
.lecturer-page { max-width: 1000px; }

.form-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.select-existing { max-width: 480px; }

.divider {
  border: none;
  border-top: 1px solid #f1f5f9;
  margin: 0;
}

.actions { display: flex; gap: 0.5rem; padding-top: 0.25rem; }
</style>