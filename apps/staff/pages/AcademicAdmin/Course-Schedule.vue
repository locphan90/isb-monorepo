<!--
  Academic Admin > Course Schedule
  Xếp lịch học cho các khóa tạo ở "Create Course": chọn khóa (mặc định chỉ khóa còn hiệu lực), rồi
  đặt ngày học, giờ, phòng, giảng viên, ghi chú bằng lịch. Có thể lập nhanh theo thứ trong tuần,
  bấm từng ngày để thêm/sửa/xóa, rồi bấm Save một lần. Sửa lại một ngày về sau cũng làm ở đây.
  Dữ liệu lưu ở tbl_course_schedule qua /api/course-schedule (server kiểm tra quyền menu + nút Save).
-->
<template>
  <div class="schedule-page">
    <!-- ── Danh sách khóa ───────────────────────────────────────────────── -->
    <aside class="card courses">
      <div class="card-title">Courses</div>
      <input v-model="search" type="text" placeholder="Search course or subject" autocomplete="off" />
      <label class="check-row"><input v-model="includePast" type="checkbox" /><span>Show past courses</span></label>

      <v-progress-linear v-if="loadingCourses || loadingSubjects" indeterminate />
      <p v-else-if="!visibleCourses.length" class="hint">
        No courses found{{ includePast ? '' : ' (only courses that have not ended are shown)' }}.
      </p>

      <div class="course-list">
        <button
          v-for="c in visibleCourses"
          :key="c.id"
          type="button"
          class="course-item"
          :class="{ active: selected?.id === c.id }"
          @click="selectCourse(c)"
        >
          <div class="ci-name">{{ c.courseName }}</div>
          <div class="ci-sub">{{ c.subject }}</div>
          <div class="ci-meta">
            <span>{{ c.startDate }} → {{ c.endDate }}</span>
            <span class="status" :class="c.status">{{ STATUS_LABEL[c.status] }}</span>
          </div>
          <div class="ci-meta"><span>{{ c.sessionCount }} session{{ c.sessionCount === 1 ? '' : 's' }}</span></div>
        </button>
      </div>
    </aside>

    <!-- ── Lịch của khóa đang chọn ──────────────────────────────────────── -->
    <section class="main">
      <div v-if="!selected" class="card empty">Select a course on the left to plan its schedule.</div>

      <template v-else>
        <div class="card">
          <div class="head-row">
            <div>
              <div class="course-title">{{ selected.courseName }}</div>
              <div class="hint">{{ selected.subject }} · {{ selected.startDate }} → {{ selected.endDate }}</div>
            </div>
            <v-btn variant="text" :disabled="loadingSchedule" @click="reload">Reload</v-btn>
          </div>
          <div v-if="selected.lecturers.length" class="hint">
            Lecturers of this course: {{ selected.lecturers.map((l) => `${l.name}${l.role ? ` (${l.role})` : ''}`).join(', ') }}
          </div>
          <v-progress-linear v-if="loadingSchedule" indeterminate />
        </div>

        <!-- Lập nhanh -->
        <div class="card">
          <div class="card-title">Quick plan</div>
          <div class="field">
            <label class="label">Weekdays</label>
            <div class="day-chips">
              <button
                v-for="w in WEEKDAYS"
                :key="w.day"
                type="button"
                class="day-chip"
                :class="{ on: planner.weekdays.includes(w.day) }"
                :title="w.label"
                @click="toggleWeekday(w.day)"
              >{{ w.short }}</button>
            </div>
          </div>

          <div class="grid4">
            <div class="field"><label class="label">Start time</label><input v-model="planner.start" type="time" /></div>
            <div class="field"><label class="label">End time</label><input v-model="planner.end" type="time" /></div>
            <div class="field">
              <label class="label">Room</label>
              <input v-model="planner.room" list="room-options" :maxlength="SCHEDULE_ROOM_MAX" placeholder="e.g. R301" autocomplete="off" />
            </div>
            <div class="field">
              <label class="label">Lecturer</label>
              <select v-model="planner.lecturerEmail">
                <option value="">— none —</option>
                <option v-for="l in lecturerOptions" :key="l.email" :value="l.email">{{ l.title }}</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label class="label">Note</label>
            <input v-model="planner.note" type="text" :maxlength="SCHEDULE_NOTE_MAX" placeholder="Optional" autocomplete="off" />
          </div>

          <div class="actions">
            <v-btn :disabled="loadingSchedule" @click="applyWeekdays">Add sessions on selected weekdays</v-btn>
            <span class="hint">Or click a day on the calendar to add a session with the values above.</span>
          </div>
        </div>

        <!-- Lịch -->
        <div class="card">
          <ScheduleCalendar
            :start="selected.startDate"
            :end="selected.endDate"
            :sessions="calendarSessions"
            :selected="selectedDate"
            @pick="onPick"
          />
          <div class="legend">
            <span class="chip saved">Saved</span><span class="chip new">New</span><span class="chip edited">Edited</span>
            <span class="hint">Click an empty day to add a session, click a day with sessions to edit or remove it.</span>
          </div>

          <div class="change-bar">
            <div class="hint">
              <template v-if="diff.hasChanges">
                Unsaved: {{ diff.counts.added }} new · {{ diff.counts.edited }} edited · {{ diff.counts.removed }} removed
              </template>
              <template v-else>{{ activeSessions.length }} session{{ activeSessions.length === 1 ? '' : 's' }} · no unsaved changes</template>
            </div>
            <div class="actions">
              <v-btn variant="text" :disabled="!diff.hasChanges || saving" @click="discard">Discard changes</v-btn>
              <PermBtn
                :menu-key="COURSE_SCHEDULE_MENU_KEY"
                :btn-key="COURSE_SCHEDULE_BUTTONS.SAVE"
                label="Save"
                :disabled="!diff.hasChanges"
                :loading="saving"
                @click="save"
              >Save</PermBtn>
            </div>
          </div>
        </div>

        <!-- Danh sách các buổi -->
        <div v-if="activeSessions.length" class="card">
          <div class="card-title">All sessions</div>
          <div class="table-wrap">
            <table class="sessions">
              <thead><tr><th>Date</th><th>Time</th><th>Room</th><th>Lecturer</th><th>Note</th></tr></thead>
              <tbody>
                <tr v-for="s in activeSessions" :key="s._key" @click="openDay(s.date)">
                  <td>{{ formatDateLong(s.date) }}</td>
                  <td>{{ s.start ? `${s.start}${s.end ? ' – ' + s.end : ''}` : '—' }}</td>
                  <td>{{ s.room || '—' }}</td>
                  <td>{{ lecturerNameOf(s.lecturerEmail) || '—' }}</td>
                  <td class="note-cell">{{ s.note || '' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </section>

    <!-- Gợi ý phòng đã dùng -->
    <datalist id="room-options"><option v-for="r in rooms" :key="r" :value="r" /></datalist>

    <!-- Sửa các buổi của một ngày -->
    <v-dialog v-model="dayDialog" max-width="760">
      <v-card>
        <v-card-title>{{ selectedDate ? formatDateLong(selectedDate) : '' }}</v-card-title>
        <v-card-text>
          <div v-for="s in daySessions" :key="s._key" class="day-session">
            <div class="grid4">
              <div class="field"><label class="label">Start time</label><input v-model="s.start" type="time" /></div>
              <div class="field"><label class="label">End time</label><input v-model="s.end" type="time" /></div>
              <div class="field">
                <label class="label">Room</label>
                <input v-model="s.room" list="room-options" :maxlength="SCHEDULE_ROOM_MAX" autocomplete="off" />
              </div>
              <div class="field">
                <label class="label">Lecturer</label>
                <select v-model="s.lecturerEmail">
                  <option value="">— none —</option>
                  <option v-for="l in lecturerOptionsFor(s)" :key="l.email" :value="l.email">{{ l.title }}</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label class="label">Note</label>
              <input v-model="s.note" type="text" :maxlength="SCHEDULE_NOTE_MAX" autocomplete="off" />
            </div>
            <div class="actions"><v-btn size="small" variant="text" color="error" @click="removeSession(s)">Remove this session</v-btn></div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" @click="addAnotherOnDay">Add another session on this day</v-btn>
          <v-spacer />
          <v-btn @click="dayDialog = false">Done</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import {
  COURSE_SCHEDULE_MENU_KEY, COURSE_SCHEDULE_BUTTONS, WEEKDAYS, SCHEDULE_ROOM_MAX, SCHEDULE_NOTE_MAX,
} from '~/data/schemas/courseScheduleSchema'
import { formatDateLong } from '#core/data/transformers/scheduleDates'
import {
  fromServerSession, newSession, sessionsForWeekdays, sortSessions, diffSchedule, validateSchedule, courseMatchesSubjects,
} from '~/data/transformers/courseScheduleTransformer'

definePageMeta({ title: 'Course Schedule — Academic Admin' })

const STATUS_LABEL = { running: 'In progress', upcoming: 'Upcoming', ended: 'Ended' }

const { fetchCourses, fetchSchedule, saveSchedule } = useCourseSchedule()
const { fetchSubjects } = useCourseData()
const snackbar = useSnackbarStore()
const { user } = storeToRefs(useUserStore())

const notify = (message, color = 'success') => snackbar.trigger({ message, color })
const fail = async (e, fallback) => {
  if (e?.unauthorized) return navigateTo('/login')
  notify(e?.message || fallback, 'error')
}

// ── danh sách khóa ───────────────────────────────────────────────────────────
const includePast = ref(false)
const search = ref('')
const courses = ref([])
const loadingCourses = ref(false)
const subjectCodes = ref([])
const loadingSubjects = ref(false)

const visibleCourses = computed(() => {
  const q = search.value.trim().toLowerCase()
  return courses.value.filter((c) => {
    if (!courseMatchesSubjects(c.courseName, subjectCodes.value)) return false // chỉ khóa của domain đang chọn
    return !q || c.courseName.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q)
  })
})

async function loadCourses() {
  loadingCourses.value = true
  try {
    courses.value = (await fetchCourses(includePast.value)).courses
  } catch (e) {
    await fail(e, 'Failed to load courses.')
  } finally {
    loadingCourses.value = false
  }
}
watch(includePast, loadCourses, { immediate: true })

// Môn học theo domain đang chọn (giống trang Create Course)
watch(() => user.value.domain, async (domain) => {
  loadingSubjects.value = true
  try {
    subjectCodes.value = (await fetchSubjects(domain)).map((s) => s.value)
  } catch (e) {
    notify(e.message || 'Failed to load subjects.', 'error')
  } finally {
    loadingSubjects.value = false
  }
}, { immediate: true })

// ── lịch của khóa đang chọn ──────────────────────────────────────────────────
const selected = ref(null) // { id, courseName, subject, startDate, endDate, lecturers }
const allLecturers = ref([]) // [{ email, name }] giảng viên đang hoạt động
const rooms = ref([])
const original = ref([]) // các buổi đã lưu (từ server)
const sessions = ref([]) // bản đang sửa (buổi bị xóa có _removed: true)
const loadingSchedule = ref(false)
const saving = ref(false)

const diff = computed(() => diffSchedule(original.value, sessions.value))
const activeSessions = computed(() => sessions.value.filter((s) => !s._removed).sort(sortSessions))

const lecturerNameOf = (email) => (email ? allLecturers.value.find((l) => l.email === email)?.name || email : '')

// Giảng viên của khóa xếp trước, sau đó đến giảng viên khác (dạy thay)
const lecturerOptions = computed(() => {
  const inCourse = new Set((selected.value?.lecturers || []).map((l) => l.email))
  const toItem = (l) => ({ email: l.email, title: inCourse.has(l.email) ? `${l.name} (this course)` : l.name })
  return [
    ...allLecturers.value.filter((l) => inCourse.has(l.email)).map(toItem),
    ...allLecturers.value.filter((l) => !inCourse.has(l.email)).map(toItem),
  ]
})
// Buổi đang dùng giảng viên đã ngừng hoạt động vẫn phải hiện đúng tên khi sửa
const lecturerOptionsFor = (s) =>
  !s.lecturerEmail || lecturerOptions.value.some((l) => l.email === s.lecturerEmail)
    ? lecturerOptions.value
    : [{ email: s.lecturerEmail, title: `${s.lecturerEmail} (inactive)` }, ...lecturerOptions.value]

const calendarSessions = computed(() =>
  activeSessions.value.map((s) => ({
    key: s._key,
    date: s.date,
    start: s.start,
    room: s.room,
    lecturerName: lecturerNameOf(s.lecturerEmail),
    state: diff.value.state.get(s._key),
  })),
)

const planner = reactive({ weekdays: [], start: '', end: '', room: '', lecturerEmail: '', note: '' })
const resetPlanner = () => {
  const lead = (selected.value?.lecturers || []).find((l) => l.role === 'Lecturer') || selected.value?.lecturers?.[0]
  Object.assign(planner, { weekdays: [], start: '', end: '', room: '', note: '', lecturerEmail: lead?.email || '' })
}
const toggleWeekday = (day) => {
  const i = planner.weekdays.indexOf(day)
  if (i >= 0) planner.weekdays.splice(i, 1)
  else planner.weekdays.push(day)
}

const confirmDiscard = () => !diff.value.hasChanges || window.confirm('You have unsaved changes. Discard them?')

function applyServerState(res) {
  selected.value = res.course
  allLecturers.value = res.lecturers
  rooms.value = res.rooms
  original.value = res.sessions.map(fromServerSession)
  sessions.value = original.value.map((s) => ({ ...s }))
}

async function selectCourse(c) {
  if (selected.value?.id === c.id) return
  if (!confirmDiscard()) return
  loadingSchedule.value = true
  try {
    applyServerState(await fetchSchedule(c.id))
    resetPlanner()
    selectedDate.value = ''
  } catch (e) {
    await fail(e, 'Failed to load the schedule.')
  } finally {
    loadingSchedule.value = false
  }
}

async function reload() {
  if (!selected.value || !confirmDiscard()) return
  loadingSchedule.value = true
  try {
    applyServerState(await fetchSchedule(selected.value.id))
  } catch (e) {
    await fail(e, 'Failed to load the schedule.')
  } finally {
    loadingSchedule.value = false
  }
}

// ── thao tác trên lịch ───────────────────────────────────────────────────────
const plannerDefaults = () => ({ start: planner.start, end: planner.end, room: planner.room, lecturerEmail: planner.lecturerEmail, note: planner.note })

function plannerError() {
  if (planner.end && !planner.start) return 'Please enter a start time before the end time.'
  if (planner.start && planner.end && planner.end <= planner.start) return 'End time must be after start time.'
  return ''
}

function applyWeekdays() {
  if (!planner.weekdays.length) return notify('Select at least one weekday.', 'warning')
  const err = plannerError()
  if (err) return notify(err, 'warning')
  const added = sessionsForWeekdays(selected.value, planner.weekdays, plannerDefaults(), sessions.value)
  sessions.value.push(...added)
  notify(
    added.length ? `Added ${added.length} session${added.length === 1 ? '' : 's'}. Review the calendar, then Save.` : 'Those days already have sessions.',
    added.length ? 'success' : 'info',
  )
}

const selectedDate = ref('')
const dayDialog = ref(false)
const daySessions = computed(() => activeSessions.value.filter((s) => s.date === selectedDate.value))

function openDay(date) {
  selectedDate.value = date
  dayDialog.value = true
}

function onPick(date) {
  selectedDate.value = date
  if (activeSessions.value.some((s) => s.date === date)) return openDay(date)
  const err = plannerError()
  if (err) return notify(err, 'warning')
  sessions.value.push(newSession(date, plannerDefaults()))
}

function addAnotherOnDay() {
  // Giờ để trống để không trùng giờ bắt đầu với buổi đã có trong ngày
  sessions.value.push(newSession(selectedDate.value, { ...plannerDefaults(), start: '', end: '' }))
}

function removeSession(s) {
  if (s.id) s._removed = true
  else sessions.value.splice(sessions.value.indexOf(s), 1)
  if (!daySessions.value.length) dayDialog.value = false
}

function discard() {
  sessions.value = original.value.map((s) => ({ ...s }))
}

async function save() {
  const err = validateSchedule(sessions.value, selected.value)
  if (err) return notify(err, 'warning')

  saving.value = true
  try {
    const n = diff.value.upserts.length + diff.value.deletes.length
    const res = await saveSchedule({
      courseId: selected.value.id,
      upserts: diff.value.upserts,
      deletes: diff.value.deletes,
    })
    original.value = res.sessions.map(fromServerSession)
    sessions.value = original.value.map((s) => ({ ...s }))
    const c = courses.value.find((x) => x.id === selected.value.id)
    if (c) c.sessionCount = res.sessions.length
    notify(`Schedule saved (${n} change${n === 1 ? '' : 's'}).`)
  } catch (e) {
    await fail(e, 'Failed to save the schedule.')
  } finally {
    saving.value = false
  }
}

// Cảnh báo khi rời trang hoặc đóng tab lúc còn thay đổi chưa lưu
onBeforeRouteLeave(() => confirmDiscard())
const warnUnload = (e) => { if (diff.value.hasChanges) { e.preventDefault(); e.returnValue = '' } }
onMounted(() => window.addEventListener('beforeunload', warnUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnUnload))
</script>

<style scoped>
.schedule-page { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 16px; align-items: start; max-width: 1400px; }
@media (max-width: 960px) { .schedule-page { grid-template-columns: 1fr; } }

.main { display: flex; flex-direction: column; gap: 16px; min-width: 0; }

.card {
  background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 1.25rem;
  display: flex; flex-direction: column; gap: 0.75rem;
}
.card.empty { color: #94a3b8; text-align: center; padding: 3rem 1rem; }
.card-title { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; }

.label { display: block; font-size: 0.85rem; font-weight: 600; color: #64748b; margin-bottom: 0.3rem; }
.field { display: flex; flex-direction: column; min-width: 0; }
.grid4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 700px) { .grid4 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

.hint { font-size: 0.8rem; color: #64748b; }
.actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }

.check-row { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9rem; color: #334155; }
.check-row input { cursor: pointer; accent-color: #0855e3; width: auto; }

/* danh sách khóa */
.course-list { display: flex; flex-direction: column; gap: 8px; max-height: 70vh; overflow-y: auto; }
.course-item {
  text-align: left; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;
  cursor: pointer; font: inherit; display: flex; flex-direction: column; gap: 2px;
}
.course-item:hover { border-color: #0855e3; }
.course-item.active { border-color: #0855e3; background: #f0f7ff; }
.ci-name { font-weight: 700; color: #0f172a; word-break: break-all; }
.ci-sub { font-size: 0.82rem; color: #475569; }
.ci-meta { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 0.78rem; color: #64748b; }
.status { padding: 1px 8px; border-radius: 999px; font-weight: 600; font-size: 0.72rem; }
.status.running { background: #dcfce7; color: #166534; }
.status.upcoming { background: #dbeafe; color: #1e3a8a; }
.status.ended { background: #f1f5f9; color: #64748b; }

/* tiêu đề khóa */
.head-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.course-title { font-size: 1.15rem; font-weight: 800; color: #0f172a; word-break: break-all; }

/* chọn thứ */
.day-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.day-chip {
  min-width: 52px; padding: 6px 12px; border-radius: 999px; border: 1px solid #cbd5e1; background: #fff;
  color: #475569; font: inherit; font-weight: 600; cursor: pointer;
}
.day-chip.on { background: #0855e3; border-color: #0855e3; color: #fff; }

/* chú thích + thanh thay đổi */
.legend { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.chip { display: inline-block; font-size: 0.72rem; padding: 1px 8px; border-radius: 4px; background: #dbeafe; color: #1e3a8a; }
.chip.new { background: #dcfce7; color: #166534; }
.chip.edited { background: #ffedd5; color: #9a3412; }
.change-bar {
  display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;
  border-top: 1px solid #f1f5f9; padding-top: 0.75rem;
}

/* bảng các buổi */
.table-wrap { overflow-x: auto; }
.sessions { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.sessions th { text-align: left; font-size: 0.75rem; text-transform: uppercase; color: #64748b; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
.sessions td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
.sessions tbody tr { cursor: pointer; }
.sessions tbody tr:hover { background: #f8fafc; }
.note-cell { white-space: normal !important; color: #475569; }

/* hộp thoại sửa ngày */
.day-session { display: flex; flex-direction: column; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; }
.day-session:last-child { border-bottom: none; }
</style>
