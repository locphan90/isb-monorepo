<template>
  <v-app>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Global Snackbar Notification -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top right"
      elevation="4"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
const snackbar = useSnackbarStore()
const userStore = useUserStore()

// Gọi ở đây để màu primary của Vuetify được đồng bộ theo domain sớm nhất
// có thể (trước khi layout mount). layouts/default.vue gọi lại hàm này để
// lấy `cssVars` dùng cho phần CSS thường (sidebar, logo...) — xem file đó.
useAppTheme()
</script>
