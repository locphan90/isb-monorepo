<!--
  Academic Admin > Create Course
  Nhập khóa theo QUÝ (vd 2026Q4), không nhập ngày: khóa kéo dài cả quý (start_date / end_date = ngày đầu / cuối quý).
  Tên khóa (course_name) = <mã môn>_<quý>_<chữ cái đầu của program của môn><số thứ tự>, vd BAP_Q426_T1 (data/transformers/courseRules.js).
  Program lấy từ môn học đã chọn (không nhập tay); số do DB cấp, tăng dần nếu trùng.
  Rate của khóa tự tra theo loại môn (Type của môn học) và quý của khóa trong bảng Rate (Rates), chỉ đọc; DB chụp lại khi tạo khóa.
  Dữ liệu đi qua /api/course/create (server kiểm tra quyền menu Create Course, domain và môn học).
-->
<template>
  <div class="course-page">
    <div class="form-card native-fields">
      <v-row>
        <v-col cols="12" md="6">
          <v-autocomplete
            v-model="form.subject_key"
            :items="subjectOptions"
            item-title="title"
            item-value="key"
            :loading="loadingSubjects"
            label="Subject"
            no-data-text="No subjects for this domain"
          />
        </v-col>
        <v-col cols="6" md="3">
          <v-select
            v-model="form.quarter"
            :items="quarterOptions"
            label="Quarter"
            :hint="periodHint"
            persistent-hint
          />
        </v-col>
        <v-col cols="6" md="3">
          <!-- Program của môn đã chọn; ký tự đầu của program được dùng trong tên lớp -->
          <v-text-field
            :model-value="subject?.prg || ''"
            label="Program"
            readonly
            :hint="classPreview ? `Class: ${classPreview}` : ''"
            persistent-hint
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            :model-value="courseName"
            label="Course name"
            readonly
            hint="The class number is assigned when the course is created."
            persistent-hint
          />
        </v-col>
        <v-col cols="6" md="2">
          <v-text-field :model-value="subject?.type || ''" label="Subject type" readonly />
        </v-col>
        <v-col cols="6" md="2">
          <!-- Rate tra theo loại môn + quý; chỉ đọc, DB chụp lại khi tạo khóa -->
          <v-text-field
            :model-value="rateText"
            label="Rate"
            readonly
            :hint="rateNote.text"
            persistent-hint
            :error="rateNote.warn"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field v-model.number="form.coef" type="number" step="0.1" min="0" label="Coefficient" />
        </v-col>
      </v-row>

      <div class="divider" />

      <div class="section-head">
        <span class="label">Lecturers / teaching assistants</span>
        <v-btn variant="tonal" @click="addLecturer">Add lecturer</v-btn>
      </div>

      <v-row v-for="(l, i) in form.lecturers" :key="i" align="center" dense>
        <v-col cols="12" md="3">
          <v-autocomplete
            v-model="l.lecturer"
            :items="lecturerOptions"
            item-title="name"
            item-value="email"
            return-object
            label="Lecturer"
            no-data-text="No lecturers yet. Add them in Lecturer Profile"
          />
        </v-col>
        <v-col cols="6" md="2"><v-select v-model="l.role" :items="COURSE_LECTURER_ROLES" label="Role" /></v-col>
        <v-col cols="6" md="2"><v-text-field v-model.number="l.cost_up" type="number" min="0" label="Hourly rate" /></v-col>
        <v-col cols="6" md="2">
          <v-text-field v-model.number="l.cost_qty" type="number" min="0" step="0.5" label="Teaching hours" />
        </v-col>
        <v-col cols="6" md="2"><v-text-field v-model.number="l.noofsection" type="number" min="0" label="Sessions" /></v-col>
        <v-col cols="12" md="1">
          <v-btn
            size="small"
            variant="text"
            color="error"
            :disabled="form.lecturers.length === 1"
            @click="removeLecturer(i)"
          >Remove</v-btn>
        </v-col>
      </v-row>

      <div class="divider" />

      <div class="actions">
        <v-btn :loading="saving" @click="create">Create Course</v-btn>
        <v-btn variant="text" @click="clearForm">Reset</v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { COURSE_LECTURER_ROLES, emptyCourseForm, emptyCourseLecturer } from '~/data/schemas/courseSchema'
import { buildQuarterOptions, formatAmount } from '~/data/transformers/subjectTransformer'
import { courseNamePlan, previewCourseName, quarterRange, rateHint } from '~/data/transformers/courseRules'

definePageMeta({ title: 'Create Course — Academic Admin' })

const { fetchSubjects, fetchCourseNames, fetchRate, createCourse } = useCourseData()
const { fetchLecturers } = useLecturerData()
const snackbar = useSnackbarStore()
const { user } = storeToRefs(useUserStore())

const form = reactive(emptyCourseForm())
const subjectOptions = ref([])
const lecturerOptions = ref([])
const loadingSubjects = ref(false)
const saving = ref(false)

// Quý để chọn: từ quý hiện tại (giờ Việt Nam), đủ 2 năm, giống form Rate
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
const quarterOptions = buildQuarterOptions(today)

const domain = computed(() => user.value.domain)
const subject = computed(() => subjectOptions.value.find(s => s.key === form.subject_key) || null)

// Dữ liệu dựng tên: mã môn và program lấy từ dòng môn đã chọn
const nameInput = computed(() => ({
  domain: domain.value,
  subjCode: subject.value?.value || '',
  prg: subject.value?.prg || '',
  quarter: form.quarter
}))

// Số thứ tự dự kiến: lấy tên các khóa đang dùng cùng tiền tố (DB mới là nơi chốt số khi tạo)
const existingNames = ref([])
let namesRequest = 0
const prefix = computed(() => {
  const plan = courseNamePlan(nameInput.value)
  return plan?.numbered ? plan.name : ''
})
watch(prefix, async (p) => {
  const id = ++namesRequest
  existingNames.value = []
  if (!p) return
  const names = await fetchCourseNames(p)
  if (id === namesRequest) existingNames.value = names
}, { immediate: true })

const courseName = computed(() => previewCourseName(nameInput.value, existingNames.value))
// Phần lớp dự kiến = phần sau dấu '_' cuối cùng của tên, vd BAP_Q426_T2 -> T2
const classPreview = computed(() => (courseName.value ? courseName.value.slice(courseName.value.lastIndexOf('_') + 1) : ''))

// Khóa kéo dài cả quý: hiện khoảng ngày được suy ra để người dùng biết
const periodHint = computed(() => {
  if (!form.quarter) return 'Course runs for the whole quarter'
  const { start, end } = quarterRange(form.quarter)
  return `${start} → ${end}`
})

// Rate hiệu lực: tra theo loại môn của môn học và quý đã chọn (server/DB quyết định; ở đây chỉ để xem trước)
const rateInfo = ref(null)
let rateRequest = 0
watch([subject, () => form.quarter, domain], async ([subj, quarter, d]) => {
  const id = ++rateRequest
  if (!subj || !quarter || !d) { rateInfo.value = null; return }
  rateInfo.value = { loading: true }
  const info = await fetchRate(d, subj, quarter)
  if (id === rateRequest) rateInfo.value = info
}, { immediate: true })

const rateText = computed(() => (rateInfo.value && rateInfo.value.rate != null ? formatAmount(rateInfo.value.rate) : ''))
const rateNote = computed(() => rateHint(rateInfo.value, form.quarter))

const addLecturer = () => form.lecturers.push(emptyCourseLecturer())
const removeLecturer = (i) => form.lecturers.splice(i, 1)
const clearForm = () => Object.assign(form, emptyCourseForm())

// Môn học chỉ lấy theo domain đang chọn; đổi domain thì tải lại và bỏ môn đang chọn
watch(() => user.value.domain, async (d) => {
  form.subject_key = ''
  loadingSubjects.value = true
  try {
    subjectOptions.value = await fetchSubjects(d)
  } catch (e) {
    snackbar.trigger({ message: e.message || 'Failed to load subjects.', color: 'error' })
  } finally {
    loadingSubjects.value = false
  }
}, { immediate: true })

onMounted(async () => {
  try {
    lecturerOptions.value = await fetchLecturers()
  } catch (e) {
    snackbar.trigger({ message: e.message || 'Failed to load lecturers.', color: 'error' })
  }
})

async function create() {
  saving.value = true
  try {
    const course = await createCourse({ ...form }, subject.value, domain.value)
    snackbar.trigger(
      course.rate == null
        ? { message: `Course ${course.courseName} created without a rate (no rate found for this subject type and quarter).`, color: 'warning' }
        : { message: `Course ${course.courseName} created.`, color: 'success' }
    )
    clearForm()
    existingNames.value = []
  } catch (e) {
    snackbar.trigger({ message: e.message || 'Failed to create course.', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.course-page { max-width: 1000px; }

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
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
}

.section-head { display: flex; align-items: center; justify-content: space-between; }

.divider {
  border: none;
  border-top: 1px solid #f1f5f9;
  margin: 0;
}

.actions { display: flex; gap: 0.5rem; padding-top: 0.25rem; }
</style>
