<!--
  StudentCalendar: lịch học dạng Calendar (kiểu Google Calendar) của sinh viên, chỉ đọc.
  - Day / Week: lưới theo giờ, buổi học là khối màu đúng giờ bắt đầu - kết thúc (buổi trùng giờ xếp cạnh nhau),
    vạch đỏ cho giờ hiện tại (giờ Việt Nam). Buổi chưa có giờ nằm ở hàng "TBA" phía trên.
  - Month: lưới tháng, mỗi ô tối đa 3 buổi, bấm "+n more" hoặc số ngày để xem ngày đó.
  - Bấm vào một buổi để xem chi tiết (khóa, môn, giờ, phòng, giảng viên, ghi chú).
  Mỗi khóa một màu cố định. Dữ liệu tải theo khoảng đang xem (useStudentCalendar).
-->
<template>
  <div class="gcal">
    <div class="gcal-toolbar">
      <div class="nav">
        <v-btn variant="outlined" size="small" :disabled="isCurrent" @click="goToday">Today</v-btn>
        <v-btn icon variant="text" size="small" aria-label="Previous period" @click="step(-1)">
          <AppIcon name="mdiChevronLeft" :size="22" />
        </v-btn>
        <v-btn icon variant="text" size="small" aria-label="Next period" @click="step(1)">
          <AppIcon name="mdiChevronRight" :size="22" />
        </v-btn>
        <div class="period">{{ label }}</div>
        <v-progress-circular v-if="loading" indeterminate size="18" width="2" color="primary" />
      </div>

      <div class="views" role="group" aria-label="Calendar view">
        <button
          v-for="v in CALENDAR_VIEWS"
          :key="v.key"
          type="button"
          class="pill"
          :class="{ on: view === v.key }"
          @click="setView(v.key)"
        >{{ v.label }}</button>
      </div>
    </div>

    <p v-if="loaded && !loading && !sessions.length" class="hint">
      No classes in this period.
      <NuxtLink to="/enrollment">Go to Enrollment</NuxtLink>
    </p>

    <!-- ── Day / Week: lưới theo giờ ───────────────────────────────── -->
    <div v-if="view !== 'month'" ref="scrollEl" class="tg" :class="{ busy: loading }">
      <div class="tg-sticky">
        <div class="tg-row tg-head" :style="rowStyle">
          <div />
          <button
            v-for="d in dates"
            :key="d"
            type="button"
            class="tg-dayhead"
            :class="{ today: d === today }"
            :aria-label="`Open ${d}`"
            @click="view === 'week' && openDay(d)"
          >
            <span class="dow">{{ weekdayShort(d) }}</span>
            <span class="dnum">{{ dayNumber(d) }}</span>
          </button>
        </div>

        <div v-if="hasUntimed" class="tg-row tg-allday" :style="rowStyle">
          <div class="tg-tba">TBA</div>
          <div v-for="d in dates" :key="d" class="tg-allcell">
            <button
              v-for="(s, i) in untimedByDate[d] || []"
              :key="`${s.courseId}-${i}`"
              type="button"
              class="allchip"
              :style="{ background: courseColor(s.courseId) }"
              @click="select(s)"
            >{{ s.courseName }}</button>
          </div>
        </div>
      </div>

      <div class="tg-inner" :style="{ height: `${gridHeight}px`, gridTemplateColumns: `${GUTTER}px 1fr` }">
        <div class="tg-hours">
          <span v-for="h in labelHours" :key="h" :style="{ top: `${(h - startHour) * PX_HOUR}px` }">{{ hourLabel(h) }}</span>
        </div>

        <div class="tg-cols" :style="{ gridTemplateColumns: `repeat(${dates.length}, minmax(0, 1fr))`, '--hh': `${PX_HOUR}px` }">
          <div v-for="d in dates" :key="d" class="tg-col" :class="{ today: d === today }">
            <button
              v-for="(ev, i) in layoutByDate[d] || []"
              :key="`${ev.s.courseId}-${ev.start}-${i}`"
              type="button"
              class="ev"
              :style="eventStyle(ev)"
              :aria-label="`${ev.s.courseName}, ${formatTimeRange(ev.s)}`"
              @click="select(ev.s)"
            >
              <span class="ev-title">{{ ev.s.courseName }}</span>
              <span class="ev-time">{{ formatTimeRange(ev.s) }}</span>
              <span v-if="ev.s.room" class="ev-room">{{ ev.s.room }}</span>
            </button>
            <div v-if="d === today && nowTop !== null" class="now" :style="{ top: `${nowTop}px` }" />
          </div>
        </div>
      </div>
    </div>

    <!-- ── Month ───────────────────────────────────────────────────── -->
    <div v-else class="mg" :class="{ busy: loading }">
      <div v-for="w in MON_FIRST" :key="w" class="mg-dow">{{ w }}</div>
      <div
        v-for="d in dates"
        :key="d"
        class="mg-cell"
        :class="{ muted: d.slice(0, 7) !== anchor.slice(0, 7), today: d === today }"
      >
        <button type="button" class="mg-num" :aria-label="`Open ${d}`" @click="openDay(d)">{{ dayNumber(d) }}</button>
        <button
          v-for="(s, i) in (byDate[d] || []).slice(0, MONTH_MAX)"
          :key="`${s.courseId}-${s.start}-${i}`"
          type="button"
          class="mg-ev"
          :title="`${s.courseName} · ${formatTimeRange(s)}`"
          @click="select(s)"
        >
          <i class="dot" :style="{ background: courseColor(s.courseId) }" />
          <span v-if="s.start" class="t">{{ s.start }}</span>
          <span class="n">{{ s.courseName }}</span>
        </button>
        <button v-if="(byDate[d] || []).length > MONTH_MAX" type="button" class="mg-more" @click="openDay(d)">
          +{{ byDate[d].length - MONTH_MAX }} more
        </button>
      </div>
    </div>

    <!-- ── Chi tiết một buổi ───────────────────────────────────────── -->
    <v-dialog v-model="detailOpen" max-width="420">
      <v-card v-if="selected">
        <div class="d-bar" :style="{ background: courseColor(selected.courseId) }" />
        <v-card-title class="d-title">{{ selected.courseName }}</v-card-title>
        <v-card-text class="d-body">
          <div v-if="selected.subject" class="d-subject">{{ selected.subject }}</div>
          <div class="d-line"><AppIcon name="mdiCalendarMonth" :size="18" /> {{ formatDateLong(selected.date) }}</div>
          <div class="d-line"><AppIcon name="mdiClockOutline" :size="18" /> {{ formatTimeRange(selected) }}</div>
          <div class="d-line"><AppIcon name="mdiMapMarkerOutline" :size="18" /> {{ selected.room || 'Room to be announced' }}</div>
          <div v-if="selected.lecturerName" class="d-line"><AppIcon name="mdiAccountOutline" :size="18" /> {{ selected.lecturerName }}</div>
          <div v-if="selected.note" class="d-note">{{ selected.note }}</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="detailOpen = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { formatDateLong } from '#core/data/transformers/scheduleDates'
import { formatTimeRange } from '~/data/transformers/studentScheduleTransformer'
import {
  CALENDAR_VIEWS, visibleDates, periodLabel, isCurrentPeriod, weekdayShort, dayNumber, isTimed, sessionsByDate,
  hourRange, layoutDay, courseColor, hourLabel, nowMinutesVN, MIN_EVENT_MINUTES,
} from '~/data/transformers/studentCalendarTransformer'

const { today, view, anchor, range, sessions, loading, loaded, load, goToday, step, setView, openDay } = useStudentCalendar()

const PX_HOUR = 52 // chiều cao một giờ trên lưới
const PX_MIN = PX_HOUR / 60
const GUTTER = 52 // bề rộng cột nhãn giờ
const MONTH_MAX = 3 // số buổi tối đa hiện trong một ô của lịch tháng
const MON_FIRST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const dates = computed(() => range.value.dates)
const label = computed(() => periodLabel(view.value, anchor.value))
const isCurrent = computed(() => isCurrentPeriod(view.value, anchor.value, today))

const byDate = computed(() => sessionsByDate(sessions.value))

// ── Day / Week ──
const rowStyle = computed(() => ({ gridTemplateColumns: `${GUTTER}px repeat(${dates.value.length}, minmax(0, 1fr))` }))
const untimedByDate = computed(() => sessionsByDate(sessions.value.filter((s) => !isTimed(s))))
const hasUntimed = computed(() => dates.value.some((d) => (untimedByDate.value[d] || []).length))

const startHour = computed(() => hourRange(sessions.value).startHour)
const endHour = computed(() => hourRange(sessions.value).endHour)
const gridHeight = computed(() => (endHour.value - startHour.value) * PX_HOUR)
// Nhãn giờ: bỏ giờ đầu tiên (nằm sát mép trên), vạch giờ vẫn vẽ bằng nền
const labelHours = computed(() => Array.from({ length: endHour.value - startHour.value }, (_, i) => startHour.value + i).slice(1))

const layoutByDate = computed(() => {
  const out = {}
  for (const d of dates.value) out[d] = layoutDay((byDate.value[d] || []).filter(isTimed))
  return out
})

const eventStyle = (ev) => {
  const top = (ev.start - startHour.value * 60) * PX_MIN
  const height = Math.max(ev.end - ev.start, MIN_EVENT_MINUTES) * PX_MIN - 2
  return {
    top: `${top}px`,
    height: `${height}px`,
    left: `calc(${(ev.col / ev.cols) * 100}% + 1px)`,
    width: `calc(${100 / ev.cols}% - 3px)`,
    background: courseColor(ev.s.courseId),
  }
}

// Vạch giờ hiện tại, cập nhật mỗi phút
const nowMin = ref(nowMinutesVN())
const nowTop = computed(() => {
  const top = (nowMin.value - startHour.value * 60) * PX_MIN
  return top >= 0 && top <= gridHeight.value ? top : null
})
let timer = null

// Cuộn tới giờ đáng xem: giờ hiện tại nếu hôm nay nằm trong kỳ, không thì buổi sớm nhất, không có thì 08:00
const scrollEl = ref(null)
const scrollToFocus = () => {
  if (!scrollEl.value || view.value === 'month') return
  let focus = 8 * 60
  if (dates.value.includes(today)) focus = nowMin.value
  else {
    const starts = Object.values(layoutByDate.value).flat().map((e) => e.start)
    if (starts.length) focus = Math.min(...starts)
  }
  scrollEl.value.scrollTop = Math.max(0, (focus - startHour.value * 60 - 60) * PX_MIN)
}
watch(loading, (v) => { if (!v) nextTick(scrollToFocus) })

// ── Chi tiết ──
const selected = ref(null)
const detailOpen = ref(false)
const select = (s) => { selected.value = s; detailOpen.value = true }

onMounted(() => {
  timer = setInterval(() => { nowMin.value = nowMinutesVN() }, 60000)
  // Màn hình hẹp: mở bằng Day cho dễ đọc (đổi kiểu xem sẽ tự tải); còn lại tải ngay
  if (window.innerWidth < 700) setView('day')
  else load()
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.gcal { display: flex; flex-direction: column; gap: 10px; }

.gcal-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.nav { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.period { font-weight: 600; font-size: 1.05rem; color: #334155; margin-left: 6px; }

.views { display: flex; gap: 6px; }
.pill {
  border: 1px solid #cbd5e1; background: #fff; border-radius: 999px; padding: 4px 14px;
  font: inherit; font-size: 0.85rem; color: #475569; cursor: pointer;
}
.pill.on { background: var(--theme-primary, #a10930); border-color: var(--theme-primary, #a10930); color: #fff; }

.hint { font-size: 0.85rem; color: #64748b; margin: 0; }

.busy { opacity: 0.6; transition: opacity 0.15s; }

/* ── Lưới giờ (Day / Week) ── */
.tg { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; max-height: 72vh; overflow-y: auto; position: relative; }
.tg-sticky { position: sticky; top: 0; z-index: 3; background: #fff; border-bottom: 1px solid #e2e8f0; }
.tg-row { display: grid; }

.tg-dayhead {
  display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 0;
  background: none; border: none; border-left: 1px solid #e2e8f0; font: inherit; cursor: pointer; color: #475569;
}
.tg-dayhead .dow { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
.tg-dayhead .dnum {
  font-size: 1.25rem; min-width: 38px; height: 38px; line-height: 38px; text-align: center; border-radius: 50%; color: #0f172a;
}
.tg-dayhead.today .dow { color: var(--theme-primary, #a10930); }
.tg-dayhead.today .dnum { background: var(--theme-primary, #a10930); color: #fff; }
.tg-dayhead:hover .dnum { background: #f1f5f9; }
.tg-dayhead.today:hover .dnum { background: var(--theme-primary, #a10930); }

.tg-allday { border-top: 1px solid #f1f5f9; }
.tg-tba { font-size: 0.68rem; color: #94a3b8; text-align: right; padding: 6px 6px 0 0; }
.tg-allcell { border-left: 1px solid #e2e8f0; padding: 3px; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.allchip {
  border: none; color: #fff; font: inherit; font-size: 0.72rem; text-align: left; padding: 2px 6px; border-radius: 4px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer;
}

.tg-inner { display: grid; position: relative; }
.tg-hours { position: relative; }
.tg-hours span {
  position: absolute; right: 6px; transform: translateY(-50%); font-size: 0.68rem; color: #94a3b8; background: #fff; padding: 0 2px;
}
.tg-cols {
  display: grid; min-width: 0;
  background-image: repeating-linear-gradient(
    to bottom, transparent 0, transparent calc(var(--hh) - 1px), #e2e8f0 calc(var(--hh) - 1px), #e2e8f0 var(--hh)
  );
}
.tg-col { position: relative; border-left: 1px solid #e2e8f0; min-width: 0; }
.tg-col.today { background-color: rgba(161, 9, 48, 0.03); }

.ev {
  position: absolute; box-sizing: border-box; display: flex; flex-direction: column; gap: 1px; overflow: hidden;
  border: 1px solid #fff; border-radius: 6px; padding: 3px 6px; text-align: left; color: #fff; font: inherit;
  font-size: 0.74rem; line-height: 1.25; cursor: pointer; z-index: 1;
}
.ev:hover { filter: brightness(0.92); z-index: 2; }
.ev-title { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ev-time, .ev-room { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.92; }

.now { position: absolute; left: 0; right: 0; height: 0; border-top: 2px solid #d93025; z-index: 2; pointer-events: none; }
.now::before {
  content: ''; position: absolute; left: -5px; top: -6px; width: 10px; height: 10px; border-radius: 50%; background: #d93025;
}

/* ── Tháng ── */
.mg { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
.mg-dow { text-align: center; font-size: 0.72rem; font-weight: 700; color: #94a3b8; padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
.mg-cell {
  min-height: 104px; padding: 4px; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;
  display: flex; flex-direction: column; gap: 2px; min-width: 0;
}
.mg-cell:nth-child(7n + 7) { border-right: none; }
.mg-cell.muted { background: #fafafa; }
.mg-cell.muted .mg-num { color: #cbd5e1; }
.mg-num {
  align-self: center; min-width: 26px; height: 26px; line-height: 26px; border: none; background: none; border-radius: 50%;
  font: inherit; font-size: 0.82rem; font-weight: 600; color: #334155; cursor: pointer;
}
.mg-num:hover { background: #f1f5f9; }
.mg-cell.today .mg-num { background: var(--theme-primary, #a10930); color: #fff; }

.mg-ev {
  display: flex; align-items: center; gap: 4px; border: none; background: none; text-align: left; font: inherit;
  font-size: 0.72rem; color: #334155; padding: 1px 3px; border-radius: 4px; cursor: pointer; min-width: 0;
}
.mg-ev:hover { background: #f1f5f9; }
.mg-ev .dot { flex: none; width: 8px; height: 8px; border-radius: 50%; }
.mg-ev .t { flex: none; color: #64748b; }
.mg-ev .n { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }
.mg-more { border: none; background: none; text-align: left; font: inherit; font-size: 0.7rem; color: #64748b; padding: 0 3px; cursor: pointer; }
.mg-more:hover { text-decoration: underline; }

/* ── Chi tiết ── */
.d-bar { height: 8px; }
.d-title { word-break: break-word; white-space: normal; }
.d-body { display: flex; flex-direction: column; gap: 6px; color: #334155; }
.d-subject { color: #64748b; font-size: 0.9rem; }
.d-line { display: flex; align-items: center; gap: 8px; }
.d-note { background: #f8fafc; border-radius: 6px; padding: 6px 8px; font-size: 0.85rem; }

@media (max-width: 600px) {
  .mg-cell { min-height: 64px; }
  .mg-ev .t, .mg-ev .n { display: none; }
  .mg-ev { justify-content: center; padding: 1px; }
  .period { font-size: 0.95rem; }
}
</style>
