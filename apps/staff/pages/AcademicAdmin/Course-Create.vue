<template>
  <div class="course-page">
    <div class="form-card native-fields">
      <v-row>
        <v-col cols="12" md="6">
          <v-autocomplete
            v-model="form.subj_code"
            :items="subjectOptions"
            :loading="loadingSubjects"
            label="Subject"
            no-data-text="No subjects for this domain"
          />
        </v-col>
        <v-col cols="4" md="2"><v-select v-model="form.quarter" :items="QUARTERS" label="Quarter" /></v-col>
        <v-col cols="4" md="2"><v-select v-model="form.year" :items="years" label="Year" /></v-col>
        <v-col cols="4" md="2"><v-text-field v-model="form.class_name" label="Class" placeholder="T1" /></v-col>

        <v-col cols="12" md="6"><v-text-field :model-value="courseName" label="Course name" readonly /></v-col>
        <v-col cols="12" md="2">
          <v-text-field v-model.number="form.coef" type="number" step="0.1" min="0" label="Coefficient" />
        </v-col>
        <v-col cols="6" md="2"><v-text-field v-model="form.startdate" type="date" label="Start date" /></v-col>
        <v-col cols="6" md="2"><v-text-field v-model="form.enddate" type="date" label="End date" /></v-col>
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
import { QUARTERS, COURSE_LECTURER_ROLES, emptyCourseForm, emptyCourseLecturer } from '~/data/schemas/courseSchema'
import { buildCourseName } from '~/data/transformers/courseTransformer'

definePageMeta({ title: 'Create Course — Academic Admin' })

const { fetchSubjects, createCourse } = useCourseData()
const { fetchLecturers } = useLecturerData()
const snackbar = useSnackbarStore()
const { user } = storeToRefs(useUserStore())

const form = reactive(emptyCourseForm())
const subjectOptions = ref([])
const lecturerOptions = ref([])
const loadingSubjects = ref(false)
const saving = ref(false)

const thisYear = new Date().getFullYear()
const years = [thisYear - 1, thisYear, thisYear + 1, thisYear + 2]
const courseName = computed(() => buildCourseName(form))

const addLecturer = () => form.lecturers.push(emptyCourseLecturer())
const removeLecturer = (i) => form.lecturers.splice(i, 1)
const clearForm = () => Object.assign(form, emptyCourseForm())


// Môn học chỉ lấy theo domain đang chọn; đổi domain thì tải lại và bỏ môn đang chọn
watch(() => user.value.domain, async (domain) => {
  form.subj_code = ''
  loadingSubjects.value = true
  try {
    subjectOptions.value = await fetchSubjects(domain)
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
    const subjName = subjectOptions.value.find(s => s.value === form.subj_code)?.subjName || ''
    const name = await createCourse({ ...form }, subjName, user.value.email)
    snackbar.trigger({ message: `Course ${name} created.`, color: 'success' })
    clearForm()
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