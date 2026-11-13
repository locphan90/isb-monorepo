<!--
  Academic Admin > Create Course
  Nhập khóa theo QUÝ (vd 2026Q4), không nhập ngày: khóa kéo dài cả quý (start_date / end_date = ngày đầu / cuối quý).
  Tên khóa (course_name) theo quy tắc của từng domain (data/transformers/courseRules.js):
    - MBA, EAP: <mã môn>_<quý>_<chữ cái đầu của PROGRAM><số thứ tự>, vd BAP_Q426_T1 (Talent), BAP_Q426_P1 (PSO). Số do DB cấp, tăng dần nếu trùng.
      Program = tên chương trình trong domain (PSO / Talent), KHÔNG phải tên domain. Lấy từ môn học; môn cũ lưu tên domain trong cột prg
      thì không dùng được, khi đó chọn program của lớp ngay trên form.
    - WSU và domain chưa có quy tắc: nhập tay ô Class, vd AB_Q426_T1.
  Rate của khóa tự tra theo loại môn (Type của môn học) và quý của khóa trong bảng Rate (Rates), chỉ đọc; DB chụp lại khi tạo khóa.
  PIC (người phụ trách, không bắt buộc): chọn email trong danh sách PIC của domain (tbl_misc cat = 'PIC', val = domain), lưu vào tbl_course.pic.
  Bên dưới form là danh sách khóa của domain đang chọn (mặc định chỉ khóa chưa kết thúc, bật "Show past courses" để xem cả khóa cũ)
  và nút Edit (PermBtn, nút `edit`) để sửa hệ số, PIC và giảng viên của khóa. Tên khóa, môn, quý và Rate không sửa được.
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
          <template v-if="programNaming">
            <!-- Môn có program hợp lệ: chỉ đọc. Môn cũ (prg lưu tên domain): chọn program của lớp -->
            <v-text-field
              v-if="!subject || subject.programOk"
              :model-value="subject?.prg || ''"
              label="Program"
              readonly
              :hint="classPreview ? `Class: ${classPreview}` : ''"
              persistent-hint
            />
            <v-select
              v-else
              v-model="form.program"
              :items="programOptions"
              label="Program"
              :hint="classPreview ? `Class: ${classPreview}` : `This subject has no valid program (saved as '${subject.prg}'). Pick the program of this class.`"
              persistent-hint
            />
          </template>
          <!-- Domain chưa có quy tắc tự đặt tên (vd WSU): nhập tay lớp -->
          <v-text-field v-else v-model="form.class_name" label="Class" placeholder="T1" />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            :model-value="courseName"
            label="Course name"
            readonly
            :hint="programNaming ? 'The class number is assigned when the course is created.' : ''"
            :persistent-hint="programNaming"
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
        <v-col cols="12" md="6">
          <v-select
            v-model="form.pic"
            :items="picOptions"
            :loading="loadingPics"
            label="PIC"
            clearable
            no-data-text="No PIC configured for this domain"
          />
        </v-col>
      </v-row>

      <div class="divider" />

      <CourseLecturerRows v-model="form.lecturers" :options="lecturerOptions" />

      <div class="divider" />

      <div class="actions">
        <v-btn :loading="saving" @click="create">Create Course</v-btn>
        <v-btn variant="text" @click="clearForm">Reset</v-btn>
      </div>
    </div>

    <!-- ── Danh sách khóa ─────────────────────────────────────────────── -->
    <div class="form-card native-fields">
      <div class="section-head">
        <span class="label">Courses</span>
        <div class="list-tools">
          <v-text-field v-model="search" label="Search course, subject or PIC" density="compact" hide-details clearable class="search" />
          <v-checkbox v-model="includePast" label="Show past courses" density="compact" hide-details />
        </div>
      </div>

      <v-progress-linear v-if="loadingCourses" indeterminate />
      <p v-else-if="!visibleCourses.length" class="hint">
        No courses found{{ includePast ? '' : ' (only courses that have not ended are shown)' }}.
      </p>

      <div v-if="visibleCourses.length" class="table-wrap">
        <table class="courses">
          <thead>
            <tr>
              <th>Course</th><th>Subject</th><th>Period</th><th>Status</th><th>PIC</th>
              <th>Coef</th><th>Rate</th><th>Lecturers</th><th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in visibleCourses" :key="c.id">
              <td class="nowrap">{{ c.courseName }}</td>
              <td>{{ c.subject }}</td>
              <td class="nowrap">{{ c.startDate }} → {{ c.endDate }}</td>
              <td><span class="status" :class="c.status">{{ STATUS_LABEL[c.status] }}</span></td>
              <td>{{ c.pic || '—' }}</td>
              <td>{{ c.coef ?? '—' }}</td>
              <td>{{ c.rate == null ? '—' : formatAmount(c.rate) }}</td>
              <td>{{ c.lecturers.length ? c.lecturers.map(l => l.name).join(', ') : '—' }}</td>
              <td class="col-actions">
                <PermBtn
                  :menu-key="COURSE_MENU_KEY"
                  :btn-key="COURSE_BUTTONS.EDIT"
                  label="Edit"
                  size="small"
                  variant="tonal"
                  @click="openEdit(c)"
                >Edit</PermBtn>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Sửa khóa ───────────────────────────────────────────────────── -->
    <v-dialog v-model="editDialog" max-width="1000" persistent>
      <v-card class="native-fields">
        <v-card-title>Edit course — {{ editTarget?.courseName }}</v-card-title>
        <v-card-text>
          <p class="hint edit-info">
            {{ editTarget?.subject }} · {{ editTarget?.startDate }} → {{ editTarget?.endDate }} ·
            Rate {{ editTarget?.rate == null ? 'not set' : formatAmount(editTarget.rate) }}.
            The course name, subject, quarter and rate cannot be changed.
          </p>
          <v-row>
            <v-col cols="12" md="3">
              <v-text-field v-model.number="editForm.coef" type="number" step="0.1" min="0" label="Coefficient" />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="editForm.pic"
                :items="editPicOptions"
                label="PIC"
                clearable
                no-data-text="No PIC configured for this domain"
              />
            </v-col>
          </v-row>
          <CourseLecturerRows v-model="editForm.lecturers" :options="lecturerOptions" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="savingEdit" @click="editDialog = false">Cancel</v-btn>
          <v-btn :loading="savingEdit" @click="saveEdit">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { COURSE_MENU_KEY, COURSE_BUTTONS, emptyCourseForm } from '~/data/schemas/courseSchema'
import { courseToEditForm } from '~/data/transformers/courseTransformer'
import { buildQuarterOptions, formatAmount } from '~/data/transformers/subjectTransformer'
import {
  courseNamePlan, previewCourseName, quarterRange, rateHint, isProgramNaming, knownPrograms, resolveProgram
} from '~/data/transformers/courseRules'

definePageMeta({ title: 'Create Course — Academic Admin' })

const { fetchSubjects, fetchCourseNames, fetchRate, fetchPics, createCourse, fetchCourses, updateCourse } = useCourseData()
const { fetchLecturers } = useLecturerData()
const snackbar = useSnackbarStore()
const { user } = storeToRefs(useUserStore())

const form = reactive(emptyCourseForm())
const subjectOptions = ref([])
const lecturerOptions = ref([])
const picOptions = ref([])
const loadingPics = ref(false)
const loadingSubjects = ref(false)
const saving = ref(false)

// Quý để chọn: từ quý hiện tại (giờ Việt Nam), đủ 2 năm, giống form Rate
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
const quarterOptions = buildQuarterOptions(today)

const domain = computed(() => user.value.domain)
const subject = computed(() => subjectOptions.value.find(s => s.key === form.subject_key) || null)
const programNaming = computed(() => isProgramNaming(domain.value)) // true: tên lớp theo program; false: nhập tay Class
const programOptions = computed(() => knownPrograms(domain.value))
// Đổi môn thì bỏ program đã chọn tay của môn trước
watch(() => form.subject_key, () => { form.program = '' })

// Dữ liệu dựng tên: mã môn lấy từ môn đã chọn; program = prg của môn nếu hợp lệ, không thì program đã chọn
const nameInput = computed(() => ({
  domain: domain.value,
  subjCode: subject.value?.value || '',
  program: resolveProgram(domain.value, subject.value?.prg, form.program),
  quarter: form.quarter,
  className: form.class_name
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
// Phần lớp dự kiến (chỉ khi tên theo program) = phần sau dấu '_' cuối cùng của tên, vd BAP_Q426_T2 -> T2
const classPreview = computed(() =>
  programNaming.value && courseName.value ? courseName.value.slice(courseName.value.lastIndexOf('_') + 1) : ''
)

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

// PIC theo domain đang chọn: đổi domain thì tải lại danh sách và bỏ PIC đang chọn
let picRequest = 0
watch(() => user.value.domain, async (d) => {
  const id = ++picRequest
  form.pic = ''
  picOptions.value = []
  if (!d) return
  loadingPics.value = true
  try {
    const emails = await fetchPics(d)
    if (id === picRequest) picOptions.value = emails
  } catch (e) {
    if (id === picRequest) snackbar.trigger({ message: e.message || 'Failed to load PIC list.', color: 'error' })
  } finally {
    if (id === picRequest) loadingPics.value = false
  }
}, { immediate: true })

onMounted(async () => {
  try {
    lecturerOptions.value = await fetchLecturers()
  } catch (e) {
    snackbar.trigger({ message: e.message || 'Failed to load lecturers.', color: 'error' })
  }
})

// ── Danh sách khóa ──────────────────────────────────────────────────────────
const STATUS_LABEL = { running: 'In progress', upcoming: 'Upcoming', ended: 'Ended' }
const courses = ref([])
const loadingCourses = ref(false)
const includePast = ref(false)
const search = ref('')

let courseListRequest = 0
async function loadCourses() {
  const id = ++courseListRequest
  if (!domain.value) { courses.value = []; return }
  loadingCourses.value = true
  try {
    const rows = await fetchCourses(domain.value, includePast.value)
    if (id === courseListRequest) courses.value = rows
  } catch (e) {
    if (id === courseListRequest) snackbar.trigger({ message: e.message || 'Failed to load courses.', color: 'error' })
  } finally {
    if (id === courseListRequest) loadingCourses.value = false
  }
}
// Đổi domain hoặc bật / tắt xem khóa cũ thì tải lại
watch([domain, includePast], loadCourses, { immediate: true })

const visibleCourses = computed(() => {
  const q = (search.value || '').trim().toLowerCase()
  if (!q) return courses.value
  return courses.value.filter(c => `${c.courseName} ${c.subject} ${c.pic}`.toLowerCase().includes(q))
})

// ── Sửa khóa ────────────────────────────────────────────────────────────────
const editDialog = ref(false)
const editTarget = ref(null)
const editForm = reactive({ coef: 1, pic: '', lecturers: [] })
const savingEdit = ref(false)
// PIC hiện tại của khóa có thể không còn trong danh sách của domain: vẫn hiện để không bị mất khi xem
const editPicOptions = computed(() => {
  const cur = editTarget.value?.pic
  return cur && !picOptions.value.includes(cur) ? [cur, ...picOptions.value] : picOptions.value
})

function openEdit(c) {
  editTarget.value = c
  Object.assign(editForm, courseToEditForm(c))
  editDialog.value = true
}

async function saveEdit() {
  savingEdit.value = true
  try {
    const saved = await updateCourse(editTarget.value.id, editForm, domain.value)
    snackbar.trigger({ message: `Course ${saved.courseName} updated.`, color: 'success' })
    editDialog.value = false
    await loadCourses()
  } catch (e) {
    snackbar.trigger({ message: e.message || 'Failed to update course.', color: 'error' })
  } finally {
    savingEdit.value = false
  }
}

async function create() {
  saving.value = true
  try {
    const course = await createCourse({ ...form }, subject.value, domain.value)
    // Khóa luôn được tạo; cảnh báo nếu thiếu Rate hoặc không lưu được PIC
    const warnings = []
    if (course.rate == null) warnings.push('without a rate (no rate found for this subject type and quarter)')
    if (course.picSaved === false) warnings.push('but the PIC could not be saved, please contact the administrator')
    snackbar.trigger(
      warnings.length
        ? { message: `Course ${course.courseName} created ${warnings.join(' and ')}.`, color: 'warning' }
        : { message: `Course ${course.courseName} created.`, color: 'success' }
    )
    clearForm()
    existingNames.value = []
    loadCourses()
  } catch (e) {
    snackbar.trigger({ message: e.message || 'Failed to create course.', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.course-page { max-width: 1200px; display: flex; flex-direction: column; gap: 1rem; }

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

.hint { font-size: 0.8rem; color: #64748b; }
.edit-info { margin-bottom: 1rem; }

.section-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.list-tools { display: flex; align-items: center; gap: 1rem; }
.list-tools .search { min-width: 260px; }

.table-wrap { overflow-x: auto; }
table.courses { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
table.courses th {
  text-align: left; font-size: 0.8rem; font-weight: 600; color: #64748b;
  padding: 0.5rem 0.75rem; border-bottom: 1px solid #e2e8f0; white-space: nowrap;
}
table.courses td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
.nowrap { white-space: nowrap; }
.col-actions { white-space: nowrap; text-align: right; }

.status { font-size: 0.75rem; padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
.status.running { background: #dcfce7; color: #166534; }
.status.upcoming { background: #dbeafe; color: #1e40af; }
.status.ended { background: #f1f5f9; color: #64748b; }

.divider {
  border: none;
  border-top: 1px solid #f1f5f9;
  margin: 0;
}

.actions { display: flex; gap: 0.5rem; padding-top: 0.25rem; }
</style>
