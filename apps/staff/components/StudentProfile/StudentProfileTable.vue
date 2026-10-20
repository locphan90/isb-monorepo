<template>
  <div class="student-table-page">
    <div class="table-toolbar">
      <input v-model="search" placeholder="Search by MSSV or name..." class="search-input" @keyup.enter="onSearchEnter" />
      <v-btn :loading="loading" @click="onSearchEnter">Search</v-btn>
    </div>

    <div class="table-scroll">
    <table class="student-table">
      <thead>
        <tr>
          <th>MSSV</th>
          <th>Full Name</th>
          <th v-if="canField(menuKey, 'objProfile')">Class</th>
          <th v-for="g in booleanGroups" :key="g.key">{{ g.label }}</th>
          <th v-if="studentActions.length">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in students" :key="s.id" class="row" @click="openDetail(s)">
          <td>{{ s.mssv }}</td>
          <td>{{ s.obj_json?.objProfile?.FullName }}</td>
          <td v-if="canField(menuKey, 'objProfile')">{{ s.obj_json?.objProfile?.Klass }}</td>
          <td v-for="g in booleanGroups" :key="g.key">{{ completedCount(s, g) }}</td>
          <td v-if="studentActions.length" class="actions-cell" @click.stop>
            <PermBtn
              v-for="a in studentActions"
              :key="a.key"
              :menu-key="menuKey"
              :btn-key="a.key"
              :label="a.label"
              icon
              size="small"
              variant="text"
              @click="openAction(a, s)"
            >
              <AppIcon :name="a.icon" :size="18" />
            </PermBtn>
          </td>
        </tr>
      </tbody>
    </table>
    </div>

    <p v-if="!loading && students.length === 0" class="empty">No data.</p>

    <!-- Pagination -->
    <div v-if="totalCount > 0" class="pagination">
      <span class="pagination-info">
        {{ rangeStart }}–{{ rangeEnd }} / {{ totalCount }}
      </span>
      <select v-model.number="pageSize" class="page-size-select" @change="changePageSize">
        <option :value="10">10 / page</option>
        <option :value="20">20 / page</option>
        <option :value="50">50 / page</option>
      </select>
      <v-btn size="small" variant="text" :disabled="page <= 1" @click="goToPage(page - 1)">‹ Previous</v-btn>
      <span class="pagination-page">Page {{ page }} / {{ totalPages }}</span>
      <v-btn size="small" variant="text" :disabled="page >= totalPages" @click="goToPage(page + 1)">Next ›</v-btn>
    </div>

    <StudentActionModal
      v-model="actionModal.open"
      :type="actionModal.type"
      :student="actionModal.student"
      @saved="load"
      @deleted="load"
    />
  </div>
</template>

<script setup>
import { studentProfileSchema } from '#core/data/schemas/studentProfileSchema.js'
import { getStudentFieldValue } from '~/data/transformers/studentFields.js'
import { studentActions } from '~/data/schemas/studentActions.js'

const props = defineProps({
  menuKey: { type: String, required: true },
  detailRoute: { type: String, required: true },
})

const { canField } = usePermission()
const { loadSettings } = useStudentProfileSettings()
const { fetchStudentList } = useStudentData()

const search = ref('')
const students = ref([])
const loading = ref(false)

const page = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))
const rangeStart = computed(() => (totalCount.value === 0 ? 0 : (page.value - 1) * pageSize.value + 1))
const rangeEnd = computed(() => Math.min(page.value * pageSize.value, totalCount.value))

// Nhóm dạng checklist (boolean) mà phòng ban này được cấu hình cho hiện
// -> hiện số lượng đã có (chỉ số đếm, để trắng nếu 0) ngay trên bảng danh sách. Các nhóm dữ liệu chi
// tiết khác (objProfile, objEng...) chỉ hiện đầy đủ ở trang Chi tiết.
const booleanGroups = computed(() =>
  studentProfileSchema.groups.filter(
    (g) => g.fields[0]?.type === 'boolean' && canField(props.menuKey, g.key)
  )
)

function completedCount(student, group) {
  const done = group.fields.filter((f) => getStudentFieldValue(student.obj_json, group, f) === true).length
  // Chỉ hiện số lượng đã có (không có mẫu số); nếu = 0 thì để trắng
  return done > 0 ? done : ''
}

async function load() {
  loading.value = true
  try {
    const { data, count } = await fetchStudentList({
      search: search.value,
      page: page.value,
      pageSize: pageSize.value,
    })
    students.value = data
    totalCount.value = count
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSettings(props.menuKey)
  load()
})

function onSearchEnter() {
  page.value = 1
  load()
}

function changePageSize() {
  page.value = 1
  load()
}

function goToPage(p) {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  load()
}

function openDetail(s) {
  navigateTo(`${props.detailRoute}/${s.mssv}`)
}

const actionModal = reactive({ open: false, type: null, student: null })
function openAction(action, student) {
  actionModal.type = action.modal
  actionModal.student = student
  actionModal.open = true
}
</script>

<style scoped>
.student-table-page { width: 100%; }

/* Bảng giãn hết khung ngang; nếu cột quá nhiều thì cuộn ngang thay vì xuống hàng */
.table-scroll { width: 100%; overflow-x: auto; }

.table-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.search-input {
  flex: 1;
  max-width: 320px;
  padding: 0.45rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 15px;
}

.student-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}
.student-table th {
  text-align: left;
  padding: 8px 10px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}
.student-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}
.row { cursor: pointer; }
.row:hover td { background: #f8fafc; }
.actions-cell { display: flex; gap: 2px; }

.empty { color: #94a3b8; margin-top: 16px; }

.pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  font-size: 0.85rem;
  color: #64748b;
}
.pagination-info { white-space: nowrap; }
.page-size-select {
  padding: 0.3rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.85rem;
}
.pagination-page { white-space: nowrap; }
</style>