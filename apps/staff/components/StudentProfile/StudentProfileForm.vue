<!--
  components/StudentProfile/StudentProfileForm.vue

  Form nhập liệu DÙNG CHUNG cho cả trang Add Student và action Edit Student
  (trong StudentActionModal.vue) — luôn hiện TOÀN BỘ field theo
  config/StudentProfileSchema.js (không phụ thuộc cấu hình hiển thị theo
  phòng ban ở Setting — Setting chỉ quyết định XEM cái gì, không giới hạn
  NHẬP cái gì).

  Cách hoạt động: `modelValue` (obj_json) được SỬA TRỰC TIẾP (mutate in
  place) khi user nhập — giống PermissionTree, tránh phải v-model từng
  field một. Component cha chỉ cần đọc lại object này lúc Lưu/Tạo mới.

  Dùng:
    <StudentProfileForm :model-value="objJson" />
-->
<template>
  <div class="profile-form">
    <div v-for="g in studentProfileSchema.groups" :key="g.key" class="form-section">
      <h4>{{ g.label }}</h4>
      <div class="field-grid">
        <div v-for="f in g.fields" :key="f.key" class="form-field">
          <label>{{ f.label }}</label>

          <input
            v-if="f.type === 'text'"
            type="text"
            :value="getStudentFieldValue(modelValue, g, f)"
            @input="update(g, f, $event.target.value)"
          />
          <input
            v-else-if="f.type === 'date'"
            type="date"
            :value="getStudentFieldValue(modelValue, g, f)"
            @input="update(g, f, $event.target.value)"
          />
          <input
            v-else-if="f.type === 'currency'"
            type="number"
            :value="getStudentFieldValue(modelValue, g, f)"
            @input="update(g, f, $event.target.value === '' ? null : Number($event.target.value))"
          />
          <label v-else-if="f.type === 'boolean'" class="checkbox-field">
            <input
              type="checkbox"
              :checked="getStudentFieldValue(modelValue, g, f) === true"
              @change="update(g, f, $event.target.checked)"
            />
            <span>{{ getStudentFieldValue(modelValue, g, f) === true ? 'Yes' : 'No' }}</span>
          </label>
        </div>
      </div>
    </div>

    <!--
      Required Subjects — KHÁC các nhóm phía trên: danh sách môn không cố
      định trong schema, mà do System > Required Subjects tự nhập, đọc lại
      ở đây lúc chạy. Thêm/xoá môn bên đó là tự đổi theo ở form này, không
      cần sửa code.
    -->
    <div v-if="subjects.length" class="form-section">
      <h4>Required Subjects</h4>
      <div class="field-grid">
        <label v-for="s in subjects" :key="s.code" class="checkbox-field">
          <input
            type="checkbox"
            :checked="modelValue.RequiredSubjects?.[s.code] === true"
            @change="updateSubject(s.code, $event.target.checked)"
          />
          <span>{{ s.code }} — {{ s.name }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { studentProfileSchema } from '#core/data/schemas/studentProfileSchema.js'
import { getStudentFieldValue, setStudentFieldValue } from '~/data/transformers/studentFields.js'

const props = defineProps({
  modelValue: { type: Object, required: true },
})

function update(group, field, value) {
  setStudentFieldValue(props.modelValue, group, field, value)
}

// ── Required Subjects (danh sách động, xem System > Required Subjects) ──
const { subjects, loadSubjects } = useRequiredSubjects()

onMounted(() => {
  loadSubjects()
})

function updateSubject(code, checked) {
  if (!props.modelValue.RequiredSubjects) props.modelValue.RequiredSubjects = {}
  props.modelValue.RequiredSubjects[code] = checked
}
</script>

<style scoped>
.profile-form { display: flex; flex-direction: column; gap: 20px; }

.form-section h4 {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin: 0 0 10px;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px 16px;
}

.form-field { display: flex; flex-direction: column; gap: 4px; }
.form-field label {
  font-size: 0.75rem;
  color: #94a3b8;
}
.form-field input[type="text"],
.form-field input[type="date"],
.form-field input[type="number"] {
  padding: 0.4rem 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

.checkbox-field {
  flex-direction: row !important;
  align-items: center;
  gap: 6px !important;
  cursor: pointer;
  font-size: 0.9rem;
  color: #334155;
}
.checkbox-field input { cursor: pointer; accent-color: #0855e3; }
</style>