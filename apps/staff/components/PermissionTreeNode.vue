<!--
  components/PermissionTreeNode.vue

  1 nhánh trong cây phân quyền THEO TỪNG USER: 1 menu, các nút (buttons, tự
  phát hiện lúc chạy), và menu con (đệ quy).

  LƯU Ý: nhóm "dữ liệu SV hiển thị" (fields) KHÔNG còn ở đây nữa — đó là
  cấu hình THEO PHÒNG BAN (áp dụng chung cho mọi user ở cùng menu), chỉnh
  tại menu Setting > Hiển thị dữ liệu SV theo phòng ban, không phải theo
  từng user như cây này. Xem components/DeptFieldSettingsForm.vue.

  Cách hoạt động: `permissions` được truyền xuống và SỬA TRỰC TIẾP
  (mutate in place) thay vì dùng v-model qua nhiều tầng — vì cây có thể
  sâu nhiều cấp, làm v-model từng tầng sẽ rất rườm rà. Component cha
  (PermissionTree.vue) chỉ cần đọc lại object này khi bấm Lưu.
-->
<template>
  <div class="ptn">
    <label class="ptn-row">
      <input type="checkbox" :checked="isMenuChecked" @change="toggleMenu($event.target.checked)" />
      <span class="ptn-label">{{ node.label }}</span>
    </label>

    <div v-if="buttons.length || (node.children && node.children.length)" class="ptn-children">
      <label v-for="b in buttons" :key="b.key" class="ptn-row ptn-row--btn">
        <input type="checkbox" :checked="isButtonChecked(b.key)" @change="toggleButton(b.key, $event.target.checked)" />
        <span class="ptn-label">{{ b.label }}</span>
      </label>

      <PermissionTreeNode
        v-for="child in node.children"
        :key="child.key"
        :node="child"
        :permissions="permissions"
        :button-catalog="buttonCatalog"
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  node: { type: Object, required: true },
  permissions: { type: Object, required: true },
  buttonCatalog: { type: Object, default: () => ({}) },
})

const buttons = computed(() => {
  const defs = props.buttonCatalog?.[props.node.key] || {}
  return Object.entries(defs).map(([key, v]) => ({ key, label: v.label || key }))
})

function ensureEntry(key) {
  if (!props.permissions[key]) {
    props.permissions[key] = { menu: false, buttons: {} }
  }
  if (!props.permissions[key].buttons) props.permissions[key].buttons = {}
  return props.permissions[key]
}

const isMenuChecked = computed(() => props.permissions[props.node.key]?.menu === true)

function isButtonChecked(btnKey) {
  return props.permissions[props.node.key]?.buttons?.[btnKey] === true
}

function toggleMenu(checked) {
  ensureEntry(props.node.key).menu = checked
  // Tick menu cha -> tự tick hết nút + menu con bên dưới cho nhanh (có thể bỏ tick lại từng cái sau).
  cascade(props.node, checked)
}

function toggleButton(btnKey, checked) {
  ensureEntry(props.node.key).buttons[btnKey] = checked
}

function cascade(node, checked) {
  const entry = ensureEntry(node.key)

  const defs = props.buttonCatalog?.[node.key] || {}
  for (const btnKey of Object.keys(defs)) entry.buttons[btnKey] = checked

  for (const child of node.children || []) {
    ensureEntry(child.key).menu = checked
    cascade(child, checked)
  }
}
</script>

<style scoped>
.ptn { margin-bottom: 2px; }
.ptn-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  cursor: pointer;
  font-size: 0.92rem;
  color: #334155;
}
.ptn-row input { cursor: pointer; accent-color: #0855e3; }
.ptn-row--btn { color: #64748b; font-size: 0.87rem; }
.ptn-children {
  padding-left: 22px;
  border-left: 2px solid #e2e8f0;
  margin-left: 6px;
}
</style>
