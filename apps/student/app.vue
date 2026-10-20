<template>
  <v-app>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Snackbar toàn cục (store nằm ở packages/core/stores/ui.js) -->
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
</script>
