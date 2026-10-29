<!--
  ScheduleCalendar: lịch tháng (tuần bắt đầu từ Thứ hai) cho một khoảng ngày của khóa học.
  Dùng chung cho app staff (xếp lịch) và app sinh viên (xem lịch, readonly).

  Props:
    start, end : khoảng ngày của khóa 'YYYY-MM-DD' (ngoài khoảng này ô bị khóa)
    sessions   : [{ key, date, start?, room?, lecturerName?, state? }]  state: 'new' | 'edited' | 'saved'
    selected   : ngày đang chọn (tô viền)
  Emits:
    pick(date) : bấm vào một ngày trong khoảng của khóa

  Lưu ý: file nằm trong packages/core nên chỉ import bằng đường dẫn tương đối.
-->
<template>
  <div class="sched-cal">
    <div class="cal-head">
      <v-btn icon size="small" variant="text" :disabled="monthIdx <= 0" aria-label="Previous month" @click="monthIdx--">
        <AppIcon name="mdiChevronLeft" :size="22" />
      </v-btn>
      <div class="cal-title">{{ current?.label }}</div>
      <v-btn icon size="small" variant="text" :disabled="monthIdx >= months.length - 1" aria-label="Next month" @click="monthIdx++">
        <AppIcon name="mdiChevronRight" :size="22" />
      </v-btn>
    </div>

    <div v-if="months.length > 1" class="cal-months">
      <button
        v-for="(m, i) in months"
        :key="m.key"
        type="button"
        class="month-pill"
        :class="{ active: i === monthIdx }"
        @click="monthIdx = i"
      >
        {{ m.label.split(' ')[0].slice(0, 3) }}
        <span v-if="countByMonth[m.key]" class="pill-count">{{ countByMonth[m.key] }}</span>
      </button>
    </div>

    <div v-if="current" class="cal-grid">
      <div v-for="w in WEEKDAY_HEAD" :key="w" class="cal-dow">{{ w }}</div>

      <template v-for="week in weeks" :key="week[0].date">
        <button
          v-for="cell in week"
          :key="cell.date"
          type="button"
          class="cal-cell"
          :class="{
            muted: !cell.inMonth,
            locked: !inPeriod(cell.date),
            today: cell.date === today,
            selected: cell.date === selected,
            has: (byDate[cell.date] || []).length > 0,
          }"
          :disabled="!inPeriod(cell.date) || !cell.inMonth"
          @click="$emit('pick', cell.date)"
        >
          <span class="cal-day">{{ cell.day }}</span>
          <template v-if="cell.inMonth">
            <span
              v-for="s in (byDate[cell.date] || []).slice(0, 2)"
              :key="s.key"
              class="chip"
              :class="s.state || 'saved'"
              :title="[s.start, s.room, s.lecturerName].filter(Boolean).join(' · ')"
            >
              {{ [s.start, s.room].filter(Boolean).join(' ') || 'Session' }}
            </span>
            <span v-if="(byDate[cell.date] || []).length > 2" class="more">+{{ byDate[cell.date].length - 2 }} more</span>
          </template>
        </button>
      </template>
    </div>
    <div v-else class="cal-empty">Select a course to see its calendar.</div>
  </div>
</template>

<script setup>
import { monthsBetween, calendarWeeks, todayVN } from '../data/transformers/scheduleDates.js'

const props = defineProps({
  start: { type: String, default: '' },
  end: { type: String, default: '' },
  sessions: { type: Array, default: () => [] },
  selected: { type: String, default: '' },
})
defineEmits(['pick'])

const WEEKDAY_HEAD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const today = todayVN()

const months = computed(() => monthsBetween(props.start, props.end))
const monthIdx = ref(0)

// Khi đổi khóa: mở tháng hiện tại nếu nằm trong khóa, không thì tháng đầu của khóa
watch(
  () => [props.start, props.end],
  () => {
    const i = months.value.findIndex((m) => m.key === today.slice(0, 7))
    monthIdx.value = i >= 0 ? i : 0
  },
  { immediate: true },
)

const current = computed(() => months.value[monthIdx.value])
const weeks = computed(() => (current.value ? calendarWeeks(current.value.year, current.value.month) : []))

const inPeriod = (date) => date >= props.start && date <= props.end

const byDate = computed(() => {
  const map = {}
  for (const s of props.sessions) (map[s.date] ||= []).push(s)
  return map
})
const countByMonth = computed(() => {
  const map = {}
  for (const s of props.sessions) map[s.date.slice(0, 7)] = (map[s.date.slice(0, 7)] || 0) + 1
  return map
})
</script>

<style scoped>
.sched-cal { user-select: none; }

.cal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.cal-title { font-weight: 700; font-size: 1.05rem; color: #334155; }

.cal-months { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.month-pill {
  border: 1px solid #e2e8f0; background: #fff; border-radius: 999px; padding: 2px 10px;
  font-size: 0.78rem; color: #475569; cursor: pointer;
}
.month-pill.active { background: #0855e3; border-color: #0855e3; color: #fff; }
.pill-count { margin-left: 4px; font-weight: 700; }

.cal-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
.cal-dow { text-align: center; font-size: 0.75rem; font-weight: 700; color: #94a3b8; padding: 4px 0; }

.cal-cell {
  min-height: 78px; padding: 4px; text-align: left; background: #fff;
  border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer;
  display: flex; flex-direction: column; gap: 2px; overflow: hidden; font: inherit;
}
.cal-cell:hover:not(:disabled) { border-color: #0855e3; }
.cal-cell.muted { visibility: hidden; }
.cal-cell.locked { background: #f8fafc; color: #cbd5e1; cursor: not-allowed; }
.cal-cell.has { background: #f0f7ff; }
.cal-cell.today .cal-day { background: #0855e3; color: #fff; }
.cal-cell.selected { outline: 2px solid #0855e3; outline-offset: -2px; }

.cal-day {
  align-self: flex-start; font-size: 0.8rem; font-weight: 600; min-width: 22px; height: 22px; line-height: 22px;
  text-align: center; border-radius: 50%;
}

.chip {
  display: block; font-size: 0.7rem; line-height: 1.25; padding: 1px 5px; border-radius: 4px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background: #dbeafe; color: #1e3a8a;
}
.chip.new { background: #dcfce7; color: #166534; }
.chip.edited { background: #ffedd5; color: #9a3412; }
.more { font-size: 0.68rem; color: #64748b; }

.cal-empty { padding: 2rem; text-align: center; color: #94a3b8; }

@media (max-width: 600px) {
  .cal-cell { min-height: 56px; }
  .chip { font-size: 0.62rem; }
}
</style>
