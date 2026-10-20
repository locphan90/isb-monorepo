<template>
  <div class="login-wrapper">
    <div class="login-container">
      <div class="brand-header">
        <img src="/LogoISB.png" alt="ISB Logo" class="brand-logo" />
      </div>

      <a href="/auth/google" class="google-btn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="google-icon">
          <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.09-6.09C34.46 3.19 29.5 1 24 1 14.82 1 7.07 6.48 3.64 14.24l7.08 5.5C12.45 13.72 17.73 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.6 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.7c-.55 2.99-2.2 5.52-4.68 7.22l7.18 5.58C43.26 37.88 46.6 31.65 46.6 24.5z"/>
          <path fill="#FBBC05" d="M10.72 28.26A14.6 14.6 0 0 1 9.5 24c0-1.48.25-2.91.72-4.26l-7.08-5.5A23.9 23.9 0 0 0 0 24c0 3.86.92 7.5 2.54 10.74l8.18-6.48z"/>
          <path fill="#34A853" d="M24 47c5.5 0 10.12-1.82 13.5-4.95l-7.18-5.58c-1.82 1.22-4.15 1.94-6.32 1.94-6.27 0-11.55-4.22-13.28-9.9l-8.18 6.48C7.07 41.52 14.82 47 24 47z"/>
        </svg>
        <span>Sign in with Google</span>
      </a>
    </div>

    <!-- Vuetify Snackbar -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="5000"
      location="top"
    >
      {{ snackbarText }}
      <template #actions>
        <v-btn variant="text" @click="showSnackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()

const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('error')

onMounted(() => {
  const error = route.query.error

  if (!error) return

  // Check if your project uses a global app store for snackbars
  const globalSnackbar = typeof useAppStores === 'function' ? useAppStores().snackbar : null

  if (error === 'not_authorized') {
    const msg = 'User not authorized or not found in database.'
    if (globalSnackbar?.trigger) {
      globalSnackbar.trigger({ message: msg, color: 'warning' })
    } else {
      snackbarText.value = msg
      snackbarColor.value = 'warning'
      showSnackbar.value = true
    }
  } else if (error === 'auth_failed' || error === 'server_config_error' || error === 'db_error') {
    const msg = `Authentication failed: ${error}`
    if (globalSnackbar?.trigger) {
      globalSnackbar.trigger({ message: msg, color: 'error', timeout: 6000 })
    } else {
      snackbarText.value = msg
      snackbarColor.value = 'error'
      showSnackbar.value = true
    }
  }

  // Clean URL query params after displaying message
  router.replace({ path: route.path, query: {} })
})
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  padding: 1rem;
}

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

.brand-header {
  display: flex;
  justify-content: center;
}

.brand-logo {
  width: 160px;
  height: auto;
  object-fit: contain;
}

.google-btn {
  width: auto;
  padding: 0.4rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #5f6368;
  text-decoration: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.google-btn:hover {
  color: #202124;
  background-color: rgba(60, 64, 67, 0.06);
}

.google-btn:active {
  background-color: rgba(60, 64, 67, 0.1);
  transform: scale(0.98);
}

.google-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
</style>
