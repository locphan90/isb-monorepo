<!--
  components/PermissionTree.vue
  Dùng:
    <PermissionTree :permissions="form.permissions" />

  `permissions` là 1 reactive object, component này SỬA TRỰC TIẾP lên nó
  khi user tick/bỏ tick — cha chỉ cần đọc lại object này lúc Lưu.
-->
<template>
  <div class="permission-tree">
    <p v-if="loading" class="loading">Đang tải danh sách nút...</p>
    <PermissionTreeNode v-for="node in menuItems" :key="node.key" :node="node" :permissions="permissions"
      :button-catalog="buttonCatalog" />
  </div>
</template>

<script setup>
import { menuItems } from '~/config/menu.js'

defineProps({
  permissions: { type: Object, required: true },
})

const { getCatalog } = useButtonRegistry()
const buttonCatalog = ref({})
const loading = ref(true)

onMounted(async () => {
  buttonCatalog.value = await getCatalog()
  loading.value = false
})
</script>

<style scoped>
.permission-tree {
  font-size: 0.92rem;
}

.loading {
  color: #94a3b8;
  font-size: 0.85rem;
  margin-bottom: 8px;
}
</style>
