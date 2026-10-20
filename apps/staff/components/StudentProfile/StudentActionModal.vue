<!--
  components/StudentProfile/StudentActionModal.vue

  Modal DÙNG CHUNG cho mọi action trong config/StudentActions.js — mở ra
  đúng nội dung theo `type` (khớp field `modal` của từng action).

  Các type còn lại (grades/schedule/payment) vẫn là KHUNG (TODO) — nối dữ
  liệu thật khi có bảng tương ứng. Thêm action mới chỉ cần thêm 1 nhánh
  v-else-if bên dưới + 1 dòng trong config/StudentActions.js.
-->
<template>
  <v-dialog :model-value="modelValue" :max-width="type === 'edit' ? 900 : 600" @update:model-value="onDialogUpdate">
    <v-card v-if="student">
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text :class="{ 'scrollable-content': type === 'edit' }">
        <p class="student-name">{{ student.obj_json?.objProfile?.FullName }} — {{ student.mssv }}</p>

        <p v-if="type === 'grades'">
          TODO: connect real grade data (MBA_Grade/tbl_grade table).
        </p>
        <p v-else-if="type === 'schedule'">
          TODO: connect real schedule data.
        </p>
        <p v-else-if="type === 'payment'">
          TODO: connect real payment status data.
        </p>

        <template v-else-if="type === 'edit'">
          <StudentProfileForm v-if="editData" :model-value="editData" />
          <p v-if="feedback" class="feedback" :class="{ 'feedback--error': isError }">{{ feedback }}</p>
        </template>
      </v-card-text>
      <v-card-actions>
        <v-btn v-if="type === 'edit'" color="error" :loading="deleting" @click="handleDelete">Delete</v-btn>
        <v-spacer />
        <v-btn v-if="type === 'edit'" :loading="saving" @click="handleSave">Save</v-btn>
        <v-btn @click="close">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  type: { type: String, default: null },
  student: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'saved', 'deleted'])

const { updateStudent, retireStudent } = useStudentData()

const TITLES = {
  grades: 'View Grades',
  schedule: 'View Schedule',
  payment: 'Payment Status',
  edit: 'Edit Student',
}
const title = computed(() => TITLES[props.type] || '')

// Bản nháp đang sửa (clone rời khỏi student.obj_json thật) — chỉ ghi
// ngược vào dữ liệu thật khi bấm Save, bấm Close/huỷ thì bỏ hết thay đổi.
const editData = ref(null)
const saving = ref(false)
const deleting = ref(false)
const feedback = ref('')
const isError = ref(false)

watch(
  () => [props.modelValue, props.type, props.student],
  () => {
    feedback.value = ''
    isError.value = false
    if (props.modelValue && props.type === 'edit' && props.student) {
      editData.value = JSON.parse(JSON.stringify(props.student.obj_json || {}))
    } else {
      editData.value = null
    }
  }
)

function close() {
  emit('update:modelValue', false)
}

function onDialogUpdate(val) {
  emit('update:modelValue', val)
}

async function handleSave() {
  saving.value = true
  feedback.value = ''
  isError.value = false
  try {
    await updateStudent(props.student.id, editData.value)
    emit('saved')
    close()
  } catch (e) {
    feedback.value = e.message || 'Failed to save.'
    isError.value = true
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  const name = props.student.obj_json?.objProfile?.FullName || props.student.mssv
  if (!confirm(`Delete ${name}? This sets the record inactive (i_status = 1) — it will not be permanently removed.`)) {
    return
  }

  deleting.value = true
  feedback.value = ''
  isError.value = false
  try {
    await retireStudent(props.student.id)
    emit('deleted')
    close()
  } catch (e) {
    feedback.value = e.message || 'Failed to delete.'
    isError.value = true
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.student-name {
  font-weight: 600;
  margin-bottom: 12px;
}
.scrollable-content {
  max-height: 65vh;
  overflow-y: auto;
}
.feedback {
  font-size: 0.9rem;
  color: #16a34a;
  margin-top: 12px;
}
.feedback--error { color: #dc2626; }
</style>
