<template>
  <div class="combobox">
    <div class="input-wrap">
      <input
        ref="inputRef"
        :value="modelValue"
        type="text"
        placeholder="Select or type an email…"
        autocomplete="off"
        @input="e => { emit('update:modelValue', e.target.value); open = true; highlighted = 0 }"
        @focus="open = true"
        @blur="open = false"
        @keydown.down.prevent="highlighted = Math.min(highlighted + 1, filtered.length - 1)"
        @keydown.up.prevent="highlighted = Math.max(highlighted - 1, 0)"
        @keydown.enter.prevent="selectByIndex(highlighted)"
        @keydown.esc="open = false"
      />
      <button v-if="modelValue" class="clear-btn" tabindex="-1" @mousedown.prevent @click="clear">
        <AppIcon name="mdiClose" :size="14" />
      </button>
    </div>

    <ul v-show="open && filtered.length" class="dropdown">
      <li
        v-for="(opt, i) in filtered"
        :key="opt.id"
        :class="{ active: i === highlighted }"
        @mousedown.prevent
        @click="select(opt)"
      >
        <span>{{ opt.email }}</span>
        <span v-if="opt.i_status === 1" class="tag retired">retired</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'select', 'clear'])

const open = ref(false)
const highlighted = ref(0)

const filtered = computed(() => {
  if (!props.modelValue) return props.options
  const q = props.modelValue.toLowerCase()
  return props.options.filter(u => u.email.toLowerCase().includes(q))
})

function select(opt) {
  emit('update:modelValue', opt.email)
  emit('select', opt)
  open.value = false
}

function selectByIndex(i) {
  if (filtered.value[i]) select(filtered.value[i])
}

function clear() {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<style scoped>
.combobox { position: relative; }

.input-wrap {
  display: flex;
  align-items: center;
  border: 1px solid var(--field-border, #d1d5db);
  border-radius: var(--field-radius, 6px);
  background: #fff;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input-wrap:focus-within {
  border-color: var(--field-border-focus, #0855e3);
  box-shadow: 0 0 0 3px rgb(8 85 227 / 12%);
}

.input-wrap input {
  flex: 1;
  padding: 0.45rem 0.75rem;
  border: none !important;
  box-shadow: none !important;
  outline: none;
  width: auto;
  font-size: var(--font-size, 15px);
  background: transparent;
}

.clear-btn {
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
}
.clear-btn:hover { color: #374151; }

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  max-height: 220px;
  overflow-y: auto;
  z-index: 200;
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
}

.dropdown li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  cursor: pointer;
}
.dropdown li:hover,
.dropdown li.active { background: #eff6ff; }

.tag {
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 999px;
  font-weight: 500;
}
.tag.retired { background: #fee2e2; color: #b91c1c; }
</style>
