<!--
  components/PermBtn.vue

  Dùng thay cho <v-btn> ở BẤT KỲ đâu muốn nút đó được phân quyền.
  Style tự đồng bộ theo default của VBtn khai ở plugins/vuetify.js (1 kiểu
  duy nhất dùng chung toàn app) — không cần chỉnh gì thêm ở đây.

  Cách dùng:
    <PermBtn menu-key="eap-specific" btn-key="export_report" label="Xuất báo cáo" @click="exportReport">
      Xuất báo cáo
    </PermBtn>

  - menu-key: key của menu chứa nút này (khớp với `key` trong config/menu.js)
  - btn-key : định danh riêng của nút trong menu đó (tự đặt, viết liền không dấu,
              vd: export_report, send_reminder...)
  - label   : tên hiển thị cho admin thấy trong cây Phân quyền

  Chỉ cần thêm component này vào code là nút sẽ TỰ xuất hiện trong cây Phân quyền
  ở System > User Manager (không cần sửa file cấu hình nào khác). Trước khi có ai
  cấp quyền, nút sẽ ẨN với user thường (nhưng SYS/SYSADMIN luôn thấy mọi nút).

  Muốn đổi màu/kiểu riêng cho 1 nút cụ thể (hiếm khi cần) vẫn truyền được
  qua prop như <v-btn> bình thường, vd <PermBtn ... color="error">.
-->
<template>
  <v-btn v-if="visible" v-bind="$attrs" @click="$emit('click', $event)">
    <slot />
  </v-btn>
</template>

<script setup>
const props = defineProps({
  menuKey: { type: String, required: true },
  btnKey: { type: String, required: true },
  label: { type: String, required: true },
})
defineEmits(['click'])

const { canButton } = usePermission()
const { registerButton } = useButtonRegistry()

const visible = computed(() => canButton(props.menuKey, props.btnKey))

onMounted(() => {
  // fire-and-forget: không cần chờ, không chặn render
  registerButton(props.menuKey, props.btnKey, props.label)
})
</script>
