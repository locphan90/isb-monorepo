<!--
  Schedule: lịch học của sinh viên (các khóa đã đăng ký ở Enrollment). Hai kiểu xem, chọn ở góc trên:
  - List: lịch danh sách theo ngày. Mặc định từ hôm nay trong 7 ngày tới; đổi độ dài (7 / 14 / 30 ngày), lùi / tiến cả khoảng.
  - Calendar: lịch Day / Week / Month kiểu Google Calendar (component StudentCalendar).
  Kiểu xem đã chọn được nhớ trên trình duyệt.
-->
<template>
  <div class="schedule-page">
    <div class="modes" role="group" aria-label="Schedule display">
      <button v-for="m in MODES" :key="m.key" type="button" class="mode" :class="{ on: mode === m.key }"
        @click="setMode(m.key)">
        <AppIcon :name="m.icon" :size="18" />
        {{ m.label }}
      </button>
    </div>

    <StudentCalendar v-if="mode === 'calendar'" />

    <template v-else>
      <div class="toolbar">
        <div class="nav">
          <v-btn icon variant="text" size="small" aria-label="Previous period" :disabled="loading" @click="step(-1)">
            <AppIcon name="mdiChevronLeft" :size="22" />
          </v-btn>
          <v-btn variant="outlined" size="small" :disabled="loading || from === today" @click="goToday">Today</v-btn>
          <v-btn icon variant="text" size="small" aria-label="Next period" :disabled="loading" @click="step(1)">
            <AppIcon name="mdiChevronRight" :size="22" />
          </v-btn>
          <div class="range">{{ rangeLabel(from, days) }}</div>
        </div>

        <div class="windows" role="group" aria-label="Period length">
          <button v-for="n in WINDOW_OPTIONS" :key="n" type="button" class="pill" :class="{ on: days === n }"
            @click="setDays(n)">{{ n }} days</button>
        </div>
      </div>

      <v-progress-linear v-if="loading" indeterminate />

      <div v-if="loaded && !groups.length" class="card empty">
        <p>No classes in this period.</p>
        <p class="hint">
          Classes of the courses you enrolled in appear here once their schedule is set.
          <NuxtLink to="/enrollment">Go to Enrollment</NuxtLink>
        </p>
      </div>

      <section v-for="g in groups" :key="g.date" class="day">
        <h3 class="day-title" :class="{ today: g.date === today }">
          {{ dayLabel(g.date, today) }}
          <span v-if="g.date === today || dayLabel(g.date, today) === 'Tomorrow'" class="day-sub">{{
            formatDateLong(g.date) }}</span>
        </h3>

        <article v-for="(s, i) in g.items" :key="`${s.courseId}-${s.start}-${i}`" class="session">
          <div class="time">{{ formatTimeRange(s) }}</div>
          <div class="info">
            <div class="course">{{ s.courseName }}</div>
            <div class="subject">{{ s.subject }}</div>
            <div class="meta">
              <span>
                <AppIcon name="mdiMapMarkerOutline" :size="15" /> {{ s.room || 'Room to be announced' }}
              </span>
              <span v-if="s.lecturerName">
                <AppIcon name="mdiAccountOutline" :size="15" /> {{ s.lecturerName }}
              </span>
            </div>
            <div v-if="s.note" class="note">{{ s.note }}</div>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

<script setup>
import { formatDateLong } from '#core/data/transformers/scheduleDates'
import {
  WINDOW_OPTIONS, groupByDate, dayLabel, formatTimeRange, rangeLabel,
} from '~/data/transformers/studentScheduleTransformer'

definePageMeta({ layout: 'student', title: 'Schedule' })

const { today, from, days, sessions, loading, loaded, load, goToday, step, setDays } = useStudentSchedule()
const groups = computed(() => groupByDate(sessions.value))

// Kiểu xem: 'list' (mặc định) hoặc 'calendar'; nhớ lựa chọn lần trước trên trình duyệt này
const MODES = [
  { key: 'calendar', label: 'Calendar', icon: 'mdiCalendarMonth' },
  { key: 'list', label: 'List', icon: 'mdiFormatListBulleted' },
]
const MODE_KEY = 'student-schedule-mode'
const mode = ref('calendar')

const setMode = (m) => {
  mode.value = m
  try { localStorage.setItem(MODE_KEY, m) } catch { /* trình duyệt chặn lưu: bỏ qua */ }
  if (m === 'list' && !loaded.value) load() // lịch danh sách chỉ tải khi lần đầu được mở
}

onMounted(() => {
  let saved = null
  try { saved = localStorage.getItem(MODE_KEY) } catch { /* bỏ qua */ }
  if (MODES.some((m) => m.key === saved)) mode.value = saved
  if (mode.value === 'list') load()
})
</script>

<style scoped>
.schedule-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modes {
  display: inline-flex;
  align-self: flex-start;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  overflow: hidden;
  background: #fff;
}

.mode {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: none;
  padding: 5px 16px;
  font: inherit;
  font-size: 0.85rem;
  color: #475569;
  cursor: pointer;
}

.mode.on {
  background: var(--theme-primary, #a10930);
  color: #fff;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.nav {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.range {
  font-weight: 600;
  color: #334155;
  margin-left: 6px;
}

.windows {
  display: flex;
  gap: 6px;
}

.pill {
  border: 1px solid #cbd5e1;
  background: #fff;
  border-radius: 999px;
  padding: 4px 14px;
  font: inherit;
  font-size: 0.85rem;
  color: #475569;
  cursor: pointer;
}

.pill.on {
  background: var(--theme-primary, #a10930);
  border-color: var(--theme-primary, #a10930);
  color: #fff;
}

.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
}

.card.empty {
  text-align: center;
  color: #475569;
}

.card.empty p {
  margin: 0 0 4px;
}

.hint {
  font-size: 0.85rem;
  color: #64748b;
}

.day {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.day-title {
  margin: 6px 0 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #334155;
}

.day-title.today {
  color: var(--theme-primary, #a10930);
}

.day-sub {
  font-weight: 400;
  color: #64748b;
  margin-left: 6px;
  font-size: 0.85rem;
}

.session {
  display: flex;
  gap: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-left: 4px solid var(--theme-primary, #a10930);
  border-radius: 8px;
  padding: 12px 14px;
}

.time {
  min-width: 110px;
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.course {
  font-weight: 700;
  color: #0f172a;
  word-break: break-word;
}

.subject {
  font-size: 0.85rem;
  color: #475569;
}

.meta {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  font-size: 0.85rem;
  color: #475569;
  margin-top: 2px;
}

.meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.note {
  margin-top: 4px;
  font-size: 0.85rem;
  color: #475569;
  background: #f8fafc;
  border-radius: 6px;
  padding: 6px 8px;
}

@media (max-width: 600px) {
  .session {
    flex-direction: column;
    gap: 4px;
  }

  .time {
    min-width: 0;
  }
}
</style>
