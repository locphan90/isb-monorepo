<!--
  Khối nhập giảng viên / trợ giảng của một khóa (dùng ở form Create Course và hộp thoại sửa khóa).
  v-model = mảng dòng { lecturer: { email, name } | null, role, cost_up, cost_qty, noofsection } (xem emptyCourseLecturer).
  Thêm / xóa dòng thì phát ra mảng mới; sửa từng ô thì sửa thẳng trên dòng (cùng đối tượng với cha).
-->
<template>
  <div>
    <div class="section-head">
      <span class="label">Lecturers / teaching assistants</span>
      <v-btn variant="tonal" @click="add">Add lecturer</v-btn>
    </div>

    <v-row v-for="(l, i) in modelValue" :key="i" align="center" dense>
      <v-col cols="12" md="3">
        <v-autocomplete
          v-model="l.lecturer"
          :items="options"
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
        <v-btn size="small" variant="text" color="error" :disabled="modelValue.length === 1" @click="remove(i)">Remove</v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { COURSE_LECTURER_ROLES, emptyCourseLecturer } from '~/data/schemas/courseSchema'

const props = defineProps({
  modelValue: { type: Array, required: true },
  options: { type: Array, default: () => [] }, // [{ email, name }]
})
const emit = defineEmits(['update:modelValue'])

const add = () => emit('update:modelValue', [...props.modelValue, emptyCourseLecturer()])
const remove = (i) => emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
</script>

<style scoped>
.section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.label { font-size: 0.9rem; font-weight: 600; color: #64748b; }
</style>
