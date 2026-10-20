<script setup>
// Form upload giấy tờ -> AI đọc -> người dùng kiểm tra/sửa lại -> lưu
const emit = defineEmits(['submit'])

const { loading, extract } = useIdExtract()
const snackbar = useSnackbarStore()

const files = ref([])          // Vuetify 3: v-file-input trả về mảng File
const form = ref(emptyForm())

function emptyForm() {
  return {
    document_type: '', id_number: '', passport_number: '', full_name: '',
    gender: '', nationality: '', dob: '', origin: '', residence: '',
    issue_date: '', expiry_date: '',
  }
}

// Validate phía client trước khi gọi API (khớp rule của server)
const fileRules = [
  (v) => (v?.length >= 1 && v.length <= 2) || 'Upload 1 PDF or 1-2 images (front/back).',
  (v) => v.filter((f) => f.type === 'application/pdf').length <= 1 || 'At most one PDF.',
  (v) => !(v.length === 2 && v.some((f) => f.type === 'application/pdf')) || 'Two files must both be images.',
  (v) => v.every((f) => f.size <= 8 * 1024 * 1024) || 'Each file must be under 8 MB.',
]
const filesValid = computed(() => fileRules.every((r) => r(files.value) === true))

async function onExtract() {
  const data = await extract(files.value)
  if (!data) return
  form.value = { ...emptyForm(), ...data }
  snackbar.trigger({ message: 'Extracted. Please review before saving.', color: 'success' })
}

function onSubmit() {
  emit('submit', { ...form.value })
}

const isPassport = computed(() => form.value.document_type === 'PASSPORT')
</script>

<template>
  <v-card class="pa-4">
    <v-file-input
      v-model="files"
      label="Upload ID card (front/back) or passport"
      accept="image/png,image/jpeg,image/webp,application/pdf"
      multiple
      show-size
      counter
      prepend-icon="mdi-card-account-details-outline"
      :rules="fileRules"
    />
    <v-btn :loading="loading" :disabled="!filesValid" @click="onExtract">
      Extract data
    </v-btn>

    <v-divider class="my-4" />

    <v-row>
      <v-col cols="12" md="4">
        <v-select v-model="form.document_type" label="Document type"
          :items="['ID_CARD', 'PASSPORT']" />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field v-model="form.id_number" label="National ID number" />
      </v-col>
      <v-col v-if="isPassport" cols="12" md="4">
        <v-text-field v-model="form.passport_number" label="Passport number" />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field v-model="form.full_name" label="Full name" />
      </v-col>
      <v-col cols="12" md="3">
        <v-select v-model="form.gender" label="Gender" :items="['Nam', 'Nữ']" />
      </v-col>
      <v-col cols="12" md="3">
        <v-text-field v-model="form.nationality" label="Nationality" />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field v-model="form.dob" label="Date of birth" type="date" />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field v-model="form.issue_date" label="Issue date" type="date" />
      </v-col>
      <v-col v-if="isPassport" cols="12" md="4">
        <v-text-field v-model="form.expiry_date" label="Expiry date" type="date" />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field v-model="form.origin" label="Place of origin / birth" />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field v-model="form.residence" label="Residence" />
      </v-col>
    </v-row>

    <v-btn :disabled="!form.id_number" @click="onSubmit">Save</v-btn>
  </v-card>
</template>