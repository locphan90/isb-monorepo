<!--
  components/StudentProfile/StudentProfileDetail.vue

  Trang chi tiết 1 SV, DÙNG CHUNG cho mọi phòng ban — các nhóm dữ liệu
  hiện ra tự đổi theo quyền (`fields`) của user đăng nhập, toolbar action
  ở đầu trang cũng tự đổi theo quyền (`buttons`) — chỉ khác `menu-key`
  truyền vào từ trang gọi nó.

  Dùng:
    <StudentProfileDetail menu-key="registrar-student-list" />
  (đọc mssv từ route param — xem pages/Registrar/Student-Detail/[mssv].vue)
-->
<template>
  <div class="student-detail">
    <p v-if="loading" class="loading">Loading...</p>

    <template v-else-if="student">
      <div class="detail-header">
        <div>
          <h2>{{ student.obj_json?.objProfile?.FullName }}</h2>
          <span class="mssv-badge">{{ student.mssv }}</span>
        </div>
        <div class="header-actions">
          <PermBtn
            v-for="a in studentActions"
            :key="a.key"
            :menu-key="menuKey"
            :btn-key="a.key"
            :label="a.label"
            @click="openAction(a)"
          >
            <AppIcon :name="a.icon" :size="18" class="mr-1" />
            {{ a.label }}
          </PermBtn>
        </div>
      </div>

      <div v-for="g in visibleGroups" :key="g.key" class="detail-section">
        <h3>{{ g.label }}</h3>
        <div class="field-grid">
          <div v-for="f in g.fields" :key="f.key" class="field-item">
            <span class="field-label">{{ f.label }}</span>
            <span class="field-value">{{ formatValue(getStudentFieldValue(student.obj_json, g, f), f.type) }}</span>
          </div>
        </div>
      </div>

      <!-- Required Subjects — danh sách động (System > Required Subjects), chỉ hiện môn đã tick -->
      <div v-if="selectedSubjects.length" class="detail-section">
        <h3>Required Subjects</h3>
        <div class="field-grid">
          <div v-for="s in selectedSubjects" :key="s.code" class="field-item">
            <span class="field-value">{{ s.code }} — {{ s.name }}</span>
          </div>
        </div>
      </div>

      <p v-if="!visibleGroups.length" class="empty">No data permissions granted for this page.</p>

      <StudentActionModal
        v-model="actionModal.open"
        :type="actionModal.type"
        :student="student"
        @saved="reloadStudent"
        @deleted="onDeleted"
      />
    </template>

    <p v-else class="empty">Student not found.</p>
  </div>
</template>

<script setup>
import { studentProfileSchema } from '#core/data/schemas/studentProfileSchema.js'
import { getStudentFieldValue } from '~/data/transformers/studentFields.js'
import { studentActions } from '~/data/schemas/studentActions.js'

const props = defineProps({
  menuKey: { type: String, required: true },
  // Nơi quay về sau khi xoá (soft delete) — vd '/Registrar/Student-List'.
  // Không truyền thì sau khi xoá vẫn ở lại trang này (dữ liệu tải lại bình thường).
  listRoute: { type: String, default: '' },
})

const route = useRoute()
const { canField } = usePermission()
const { fetchStudentByMssv } = useStudentData()
const { loadSettings } = useStudentProfileSettings()

const student = ref(null)
const loading = ref(true)

const visibleGroups = computed(() =>
  studentProfileSchema.groups.filter((g) => canField(props.menuKey, g.key))
)

// ── Required Subjects (danh sách động, xem System > Required Subjects) ──
const { subjects, loadSubjects } = useRequiredSubjects()
onMounted(() => {
  loadSubjects()
})
const selectedSubjects = computed(() =>
  subjects.value.filter((s) => student.value?.obj_json?.RequiredSubjects?.[s.code] === true)
)

function formatValue(value, type) {
  if (type === 'boolean') return value === true ? 'Yes' : 'No'
  if (type === 'currency') return value ? Number(value).toLocaleString('vi-VN') + ' VND' : ''
  return value ?? ''
}

async function reloadStudent() {
  student.value = await fetchStudentByMssv(route.params.mssv)
}

onMounted(async () => {
  loading.value = true
  loadSettings(props.menuKey)
  try {
    student.value = await fetchStudentByMssv(route.params.mssv)
  } finally {
    loading.value = false
  }
})

const actionModal = reactive({ open: false, type: null })
function openAction(a) {
  actionModal.type = a.modal
  actionModal.open = true
}

function onDeleted() {
  if (props.listRoute) {
    navigateTo(props.listRoute)
  } else {
    reloadStudent()
  }
}
</script>

<style scoped>
.student-detail { max-width: 900px; }

.loading, .empty { color: #94a3b8; }

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 16px;
}
.detail-header h2 { margin: 0 0 4px; }
.mssv-badge {
  display: inline-block;
  background: #eef2ff;
  color: #3730a3;
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 6px;
}
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.detail-section { margin-bottom: 22px; }
.detail-section h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  margin: 0 0 10px;
}
.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px 20px;
}
.field-item { display: flex; flex-direction: column; }
.field-label { font-size: 0.75rem; color: #94a3b8; }
.field-value { font-size: 0.92rem; color: #1e293b; }
</style>