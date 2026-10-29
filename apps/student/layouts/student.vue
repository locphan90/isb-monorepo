<!--
  Layout của site sinh viên: header + sidebar giống app staff (cùng bố cục, màu theo packages/core/config/ui.js).
  app.vue đã có <v-app> và snackbar toàn cục nên ở đây dùng div thường.
  Tiêu đề trên header lấy từ definePageMeta({ title }) của từng trang (trang không tự lặp lại tiêu đề).
-->
<template>
  <div class="app-shell" :style="cssVars">
    <!-- Header -->
    <header class="app-header">
      <div class="app-header-left">
        <button class="toggle-btn" :aria-label="sidebarOpen ? 'Collapse menu' : 'Expand menu'" @click="sidebarOpen = !sidebarOpen">
          <AppIcon :name="sidebarOpen ? 'mdiBackburger' : 'mdiMenu'" :size="22" />
        </button>
        <div class="brand-container">
          <img src="/LogoISB.png" alt="ISB Logo" class="app-logo" />
        </div>
      </div>

      <div class="app-header-right">
        <div class="page-title-container">
          <h1 class="header-page-title">{{ currentPageTitle }}</h1>
        </div>
        <div class="header-actions">
          <span class="user-display"><strong>{{ user?.name }}</strong></span>
          <button class="icon-btn" title="Sign out" aria-label="Sign out" @click="signOut">
            <AppIcon name="mdiLogout" :size="20" />
          </button>
        </div>
      </div>
    </header>

    <!-- Sidebar -->
    <aside class="app-sidebar" :class="{ collapsed: !sidebarOpen }">
      <nav>
        <NuxtLink
          v-for="item in menuItems"
          :key="item.key"
          :to="item.path"
          class="nav-item"
          active-class="nav-item--active"
          :title="item.label"
        >
          <AppIcon :name="item.icon" :size="20" class="nav-icon" />
          <span class="nav-label">{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </aside>

    <!-- Nội dung -->
    <main class="app-main">
      <div class="app-content">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ui } from '#core/config/ui.js'
import { menuItems } from '~/config/menu.js'

const route = useRoute()
const { user } = useUserSession()
const { signOut } = useStudentSelfProfile()

// Sidebar mở sẵn trên máy tính, thu gọn (chỉ icon) trên điện thoại
const sidebarOpen = useState('student-sidebar-open', () => true)
onMounted(() => {
  if (window.innerWidth < 768) sidebarOpen.value = false
})

const cssVars = {
  '--theme-primary': ui.colors.primary,
  '--sidebar-bg': ui.colors.primary,
  '--logo-bg': '#ffffff',
  '--toggle-color': ui.colors.primary,
}

const currentPageTitle = computed(() => route.meta?.title || '')
</script>

<style scoped>
.app-shell {
  --header-h: 56px;
  --sidebar-w: 220px;
  --sidebar-w-collapsed: 56px;
  --transition: 0.22s ease;

  display: grid;
  grid-template-rows: var(--header-h) 1fr;
  grid-template-columns: var(--sidebar-w) 1fr;
  grid-template-areas:
    "header header"
    "sidebar main";
  min-height: 100vh;
  transition: grid-template-columns var(--transition);
}

.app-shell:has(.app-sidebar.collapsed) {
  grid-template-columns: var(--sidebar-w-collapsed) 1fr;
}

/* Header */
.app-header {
  grid-area: header;
  display: flex;
  height: var(--header-h);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.app-header-left {
  width: var(--sidebar-w);
  height: 100%;
  background: var(--logo-bg);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.5rem;
  flex-shrink: 0;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  transition: width var(--transition);
  box-sizing: border-box;
}

.app-shell:has(.app-sidebar.collapsed) .app-header-left {
  width: var(--sidebar-w-collapsed);
  justify-content: center;
}

.app-shell:has(.app-sidebar.collapsed) .brand-container {
  display: none;
}

.brand-container {
  display: flex;
  align-items: center;
  height: 100%;
  flex: 1;
  min-width: 0;
}

.app-logo {
  height: calc(var(--header-h) - 16px);
  width: auto;
  max-width: 100%;
  object-fit: contain;
  display: block;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--toggle-color);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--transition);
}

.toggle-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

.app-header-right {
  flex: 1;
  min-width: 0;
  background: var(--theme-primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 1.25rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.page-title-container {
  display: flex;
  align-items: center;
  overflow: hidden;
}

.header-page-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.01em;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-shrink: 0;
}

.user-display {
  font-size: 0.9rem;
  color: #ffffff;
  white-space: nowrap;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  transition: background var(--transition);
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Sidebar */
.app-sidebar {
  grid-area: sidebar;
  background: var(--sidebar-bg);
  color: rgba(255, 255, 255, 0.85);
  overflow-y: auto;
  overflow-x: hidden;
  transition: width var(--transition);
  width: var(--sidebar-w);
  position: sticky;
  top: var(--header-h);
  height: calc(100vh - var(--header-h));
}

.app-sidebar.collapsed {
  width: var(--sidebar-w-collapsed);
}

nav {
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 1rem;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
  border-left: 3px solid transparent;
  width: 100%;
  box-sizing: border-box;
  font-size: 0.9rem;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.nav-item--active {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-left-color: #fff;
  font-weight: 600;
}

.nav-icon {
  flex-shrink: 0;
}

.app-sidebar.collapsed .nav-label {
  display: none;
}

/* Nội dung */
.app-main {
  grid-area: main;
  padding: 1.5rem;
  background: #f8fafc;
  min-width: 0;
}

.app-content {
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 600px) {
  .app-main { padding: 1rem 0.75rem; }
  .user-display { display: none; }
}
</style>
