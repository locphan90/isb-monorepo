<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :style="{ fill: color }"
  >
    <path :d="iconPath" />
  </svg>
</template>

<script setup>
import * as icons from '@mdi/js'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 20 },
  color: { type: String, default: 'currentColor' },
})

const iconPath = computed(() => icons[props.name] ?? icons.mdiAlertCircle)
</script>
