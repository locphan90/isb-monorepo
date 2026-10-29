<!--
  Enrollment: khóa còn hiệu lực khớp môn bắt buộc (RequiredSubjects) của sinh viên để đăng ký.
  Khóa đã đăng ký thì không đăng ký lại; nếu khóa đã có lịch thì xem được lịch của khóa đó.
  Quyền đăng ký do server quyết định (hàm enroll_student_course); trang này chỉ hiển thị.
-->
<template>
  <div class="enroll-page">
    <v-progress-linear v-if="loading" indeterminate />

    <v-alert v-if="loaded && requiredCount === 0" type="info" variant="tonal">
      No required subjects have been set for you yet, so there is nothing to register for. Please contact the Registrar.
    </v-alert>

    <v-alert v-else-if="loaded && !courses.length" type="info" variant="tonal">
      No courses are open for your required subjects right now.
    </v-alert>

    <!-- Đã đăng ký -->
    <section v-if="groups.enrolled.length" class="block">
      <h3>My courses</h3>
      <article v-for="c in groups.enrolled" :key="c.id" class="course">
        <div class="course-main">
          <div class="course-name">{{ c.courseName }}</div>
          <div class="course-sub">{{ c.subject }}</div>
          <div class="course-meta">
            <span>{{ c.startDate }} → {{ c.endDate }}</span>
            <span class="status" :class="c.status">{{ STATUS_LABEL[c.status] }}</span>
          </div>
        </div>
        <div class="course-actions">
          <span class="badge-enrolled"><AppIcon name="mdiCheckCircleOutline" :size="16" /> Enrolled</span>
          <v-btn v-if="c.sessionCount > 0" size="small" variant="outlined" @click="openSchedule(c)">View schedule</v-btn>
          <span v-else class="muted">Schedule not available yet</span>
        </div>
      </article>
    </section>

    <!-- Còn mở đăng ký -->
    <section v-if="groups.open.length" class="block">
      <h3>Open for registration</h3>
      <article v-for="c in groups.open" :key="c.id" class="course">
        <div class="course-main">
          <div class="course-name">{{ c.courseName }}</div>
          <div class="course-sub">{{ c.subject }}</div>
          <div class="course-meta">
            <span>{{ c.startDate }} → {{ c.endDate }}</span>
            <span class="status" :class="c.status">{{ STATUS_LABEL[c.status] }}</span>
          </div>
        </div>
        <div class="course-actions">
          <v-btn :loading="enrollingId === c.id" :disabled="!!enrollingId" @click="confirmCourse = c">Enroll</v-btn>
        </div>
      </article>
    </section>

    <!-- Xác nhận đăng ký -->
    <v-dialog :model-value="!!confirmCourse" max-width="460" @update:model-value="(v) => { if (!v) confirmCourse = null }">
      <v-card v-if="confirmCourse">
        <v-card-title>Enroll in this course?</v-card-title>
        <v-card-text>
          <strong>{{ confirmCourse.courseName }}</strong><br />
          {{ confirmCourse.subject }}<br />
          {{ confirmCourse.startDate }} → {{ confirmCourse.endDate }}
          <p class="confirm-note">You can only enroll in the same course once.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="!!enrollingId" @click="confirmCourse = null">Cancel</v-btn>
          <v-btn :loading="!!enrollingId" @click="doEnroll">Enroll</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Lịch của một khóa đã đăng ký -->
    <v-dialog v-model="scheduleOpen" max-width="900">
      <v-card>
        <v-card-title>{{ scheduleCourse?.courseName }}</v-card-title>
        <v-card-text>
          <v-progress-linear v-if="scheduleLoading" indeterminate />
          <template v-if="scheduleData">
            <div class="course-sub sched-sub">{{ scheduleData.course.subject }} · {{ scheduleData.course.startDate }} → {{ scheduleData.course.endDate }}</div>
            <ScheduleCalendar
              :start="scheduleData.course.startDate"
              :end="scheduleData.course.endDate"
              :sessions="toCalendarSessions(scheduleData.sessions)"
            />
            <div class="table-wrap">
              <table class="sessions">
                <thead><tr><th>Date</th><th>Time</th><th>Room</th><th>Lecturer</th><th>Note</th></tr></thead>
                <tbody>
                  <tr v-for="(s, i) in scheduleData.sessions" :key="i">
                    <td>{{ formatDateLong(s.date) }}</td>
                    <td>{{ s.start ? `${s.start}${s.end ? ' – ' + s.end : ''}` : '—' }}</td>
                    <td>{{ s.room || '—' }}</td>
                    <td>{{ s.lecturerName || '—' }}</td>
                    <td class="note-cell">{{ s.note || '' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="scheduleOpen = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { formatDateLong } from '#core/data/transformers/scheduleDates'
import { toCalendarSessions } from '~/data/transformers/studentScheduleTransformer'

definePageMeta({ layout: 'student', title: 'Enrollment' })

const STATUS_LABEL = { running: 'In progress', upcoming: 'Upcoming' }

const { loading, loaded, requiredCount, courses, groups, enrollingId, load, enroll, fetchCourseSchedule } = useStudentEnrollment()

// Đăng ký
const confirmCourse = ref(null)
async function doEnroll() {
  const course = confirmCourse.value
  if (!course) return
  await enroll(course)
  confirmCourse.value = null
}

// Xem lịch của khóa đã đăng ký
const scheduleOpen = ref(false)
const scheduleCourse = ref(null)
const scheduleData = ref(null)
const scheduleLoading = ref(false)

async function openSchedule(course) {
  scheduleCourse.value = course
  scheduleData.value = null
  scheduleOpen.value = true
  scheduleLoading.value = true
  scheduleData.value = await fetchCourseSchedule(course)
  scheduleLoading.value = false
  if (!scheduleData.value) scheduleOpen.value = false
}

onMounted(load)
</script>

<style scoped>
.enroll-page { display: flex; flex-direction: column; gap: 16px; }
.block { display: flex; flex-direction: column; gap: 10px; }
.block h3 { margin: 4px 0 0; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; }

.course {
  display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;
}
.course-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.course-name { font-weight: 700; color: #0f172a; word-break: break-word; }
.course-sub { font-size: 0.85rem; color: #475569; }
.course-meta { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; font-size: 0.8rem; color: #64748b; margin-top: 2px; }
.status { padding: 1px 8px; border-radius: 999px; font-weight: 600; font-size: 0.72rem; }
.status.running { background: #dcfce7; color: #166534; }
.status.upcoming { background: #dbeafe; color: #1e3a8a; }

.course-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.badge-enrolled { display: inline-flex; align-items: center; gap: 4px; color: #166534; background: #dcfce7; border-radius: 999px; padding: 3px 10px; font-size: 0.82rem; font-weight: 600; }
.muted { font-size: 0.82rem; color: #94a3b8; }

.confirm-note { margin: 10px 0 0; font-size: 0.85rem; color: #64748b; }
.sched-sub { margin-bottom: 8px; }

.table-wrap { overflow-x: auto; margin-top: 14px; }
.sessions { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.sessions th { text-align: left; font-size: 0.75rem; text-transform: uppercase; color: #64748b; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
.sessions td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
.note-cell { white-space: normal !important; color: #475569; }
</style>
