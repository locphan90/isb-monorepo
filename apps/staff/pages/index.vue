<template>
  <div class="dashboard-page">
    <!--
      Chỉ chọn/hiện Dashboard SAU KHI đã biết domain thật của user
      (user.isLoggedIn chỉ = true sau khi fetchUserProfile() lấy xong dữ liệu
      từ Supabase - xem stores/user.js). Trước đó hiện loading, KHÔNG render
      Default-Dashboard trước rồi đổi sang dashboard khác -> hết cảm giác
      "nhảy trang".
    -->
    <div v-if="!user.isLoggedIn" class="dashboard-loading">
      <v-progress-circular indeterminate color="primary" size="40" width="4" />
    </div>

    <Transition v-else name="fade" mode="out-in">
      <component :is="activeDashboardComponent" :key="componentKey" />
    </Transition>
  </div>
</template>

<script setup>
import { computed, markRaw } from 'vue'
import { storeToRefs } from 'pinia'

import EapDashboard from '~/components/Dashboard/EAP-Dashboard.vue'
import IspDashboard from '~/components/Dashboard/ISP-Dashboard.vue'
import WsuDashboard from '~/components/Dashboard/WSU-Dashboard.vue'
import DefaultDashboard from '~/components/Dashboard/Default-Dashboard.vue'

const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const { hasRight } = userStore

// Distinct key ensures full clean re-render when switching domains via the top-bar dropdown
const componentKey = computed(() => {
  return `${user.value?.domain || 'no-domain'}-${user.value?.role || 'no-role'}`
})

// Priority-based component resolution
const activeDashboardComponent = computed(() => {
  const currentDomain = user.value?.domain
  const isAdmin = hasRight('manage_users') // Adapt this to your role checker or user.value.role check

  // 1. Role priority: global admin view
  if (currentDomain === 'WSU') {
    return markRaw(WsuDashboard)
  }

  // 2. Domain-specific resolution
  if (currentDomain === 'EAP') {
    return markRaw(EapDashboard)
  }

  if (currentDomain === 'ISP') {
    return markRaw(IspDashboard)
  }

  // 3. Fallback for unconfigured roles or domains
  return markRaw(DefaultDashboard)
})

definePageMeta({
  title: 'Dashboard',
})

</script>

<style scoped>
.dashboard-page {
  width: 100%;
}

.dashboard-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
