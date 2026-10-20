<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: Number,
  label: String,
  required: Boolean,
  variant: {
    type: String,
    default: 'outlined',
  },
  density: {
    type: String,
    default: 'compact',
  },
})

const emit = defineEmits(['update:modelValue'])

const displayValue = computed({
  get() {
    return props.modelValue == null ? '' : props.modelValue.toLocaleString("en-US")
  },
  set(val) {
    const number = parseFloat(val.replace(/,/g, ''))
    emit('update:modelValue', isNaN(number) ? null : number)
  }
})
</script>

<template>
  <v-text-field
    :label="label"
    :variant="variant"
    :density="density"
    :required="required"
    v-model="displayValue"
    type="text"
    inputmode="numeric"
  />
</template>