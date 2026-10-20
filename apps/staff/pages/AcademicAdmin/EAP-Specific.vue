<template>
  <div>
    <!--
      Ví dụ minh hoạ cách dùng PermBtn — CHỈ CẦN thêm component này với
      menu-key/btn-key mới là nó tự xuất hiện trong cây Phân quyền ở
      System > User Manager, không cần sửa thêm gì khác.
    -->
    <PermBtn
      menu-key="eap-specific"
      btn-key="export_report"
      label="Export Report"
      @click="exportReport"
    >
      Export Report
    </PermBtn>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'EAP Specific',
})

//const { user } = useUserStore()
const { snackbar, ui, user } = useAppStores()

function exportReport() {
  // TODO: logic xuất báo cáo thật
  console.log('export report clicked')
}
</script>

<style scoped>
</style>
