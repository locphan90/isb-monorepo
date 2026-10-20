<template>
  <div 
    class="app-shell"
    :style="cssVars"
  >
    <!-- Header -->
    <header class="app-header">
      <div class="app-header-left">
        <button class="toggle-btn" @click="sidebarOpen = !sidebarOpen">
          <AppIcon :name="sidebarOpen ? 'mdiBackburger' : 'mdiMenu'" :size="22" />
        </button>

        <!-- Brand / Logo -->
        <div class="brand-container">
          <img
            v-if="user.domainInfo?.logo || user.domain"
            :src="`/${user.domainInfo?.logo || 'Logo' + user.domain + '.png'}`"
            :alt="user.domain"
            class="app-logo"
          />
        </div>
      </div>

      <div class="app-header-right">
        <!-- Dynamic Page Title on the Top Bar -->
        <div class="page-title-container">
          <h1 class="header-page-title">{{ currentPageTitle }}</h1>
        </div>

        <!-- User Info & Actions -->
        <div class="header-actions">
          <span class="user-display">
            <strong>{{ user.name }}</strong>
          </span>

          <!-- Single-element seamless dropdown (only visible when multiple domains exist) -->
          <select 
            v-if="user.domains?.length > 1" 
            :value="user.domain" 
            class="domain-dropdown"
            @change="handleDomainChange"
          >
            <option 
              v-for="domain in user.domains" 
              :key="domain" 
              :value="domain"
            >
              {{ domain }}
            </option>
          </select>

          <!-- Logout Button -->
          <button class="icon-btn" title="Sign out" @click="logout">
            <AppIcon name="mdiLogout" :size="20" />
          </button>
        </div>
      </div>
    </header>

    <!-- Sidebar -->
    <aside class="app-sidebar" :class="{ collapsed: !sidebarOpen }">
      <nav v-if="user.isLoggedIn">
        <template v-for="item in visibleItems" :key="item.label">
          <!-- Parent Group with Submenu -->
          <div v-if="item.children?.length" class="nav-group">
            
            <!-- Parent item: bấm là mở menu con + vào menu con đầu tiên -->
            <button
              type="button"
              class="nav-item nav-item--parent"
              :class="{ 'nav-item--open': expandedMenus.includes(item.label) }"
              @click="onParentClick(item)"
            >
              <AppIcon :name="item.icon" :size="20" class="nav-icon" />
              <span class="nav-label">{{ item.label }}</span>
              <AppIcon 
                name="mdiChevronDown" 
                :size="16" 
                class="arrow-icon"
                :class="{ rotated: expandedMenus.includes(item.label) }"
              />
            </button>

            <!-- Submenu Items -->
            <div v-show="expandedMenus.includes(item.label)" class="sub-menu">
              <NuxtLink
                v-for="sub in item.children"
                :key="sub.path"
                :to="sub.path"
                class="nav-item nav-item--sub"
                active-class="nav-item--active"
              >
                <AppIcon :name="sub.icon" :size="17" class="nav-icon" />
                <span class="nav-label">{{ sub.label }}</span>
              </NuxtLink>
            </div>
          </div>

          <!-- Direct Link (No Children) -->
          <NuxtLink
            v-else
            :to="item.path"
            class="nav-item"
            active-class="nav-item--active"
          >
            <AppIcon :name="item.icon" :size="20" class="nav-icon" />
            <span class="nav-label">{{ item.label }}</span>
          </NuxtLink>
        </template>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { menuItems } from '~/config/menu.js'

const route = useRoute()
const sidebarOpen = useSidebar()

// 1. User store
const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const { logout, setDomain } = userStore
const { canMenu } = usePermission()
const { cssVars } = useAppTheme()

// Handle domain dropdown selection
function handleDomainChange(event) {
  if (setDomain) {
    setDomain(event.target.value)
  }
}

// Dynamic Page Title
const currentPageTitle = computed(() => {
  if (route.meta?.title) return route.meta.title
  if (typeof route.name === 'string') {
    return route.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return ''
})

// Submenu dropdown state
const expandedMenus = ref(['System'])

function toggleSubmenu(label) {
  if (expandedMenus.value.includes(label)) {
    expandedMenus.value = expandedMenus.value.filter((item) => item !== label)
  } else {
    expandedMenus.value.push(label)
  }
}

// Bấm menu cha: luôn mở menu con và vào menu con ĐẦU TIÊN (mặc định, không
// cần bấm 2 lần). Ngoại lệ: nếu đang mở sẵn và đang đứng trong 1 menu con
// của nhóm này thì bấm lại sẽ chỉ THU GỌN nhóm (để còn cách đóng menu).
function isInsideGroup(item) {
  return item.children.some(
    (sub) => route.path === sub.path || route.path.startsWith(sub.path + '/')
  )
}

function onParentClick(item) {
  const isOpen = expandedMenus.value.includes(item.label)
  if (isOpen && isInsideGroup(item)) {
    toggleSubmenu(item.label)
    return
  }
  openSubmenu(item.label)
  const first = item.children[0]
  if (first?.path) navigateTo(first.path)
}

function openSubmenu(label) {
  if (!expandedMenus.value.includes(label)) {
    expandedMenus.value.push(label)
  }
}

// Check domain rules against current user.domain
function hasDomain(domainRule) {
  if (!domainRule) return true
  const currentDomain = user.value?.domain
  if (!currentDomain) return false

  if (Array.isArray(domainRule)) {
    return domainRule.includes(currentDomain)
  }
  return domainRule === currentDomain
}

// Check both rights and domain requirements
function canAccess(item) {
  const allowedByRight = item.public === true || canMenu(item.key)
  return allowedByRight && hasDomain(item.domain)
}

// Filter menus via store's hasRight and domain checks
const visibleItems = computed(() => {
  return menuItems
    .filter((item) => canAccess(item))
    .map((item) => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter((sub) => canAccess(sub)),
        }
      }
      return item
    })
    .filter((item) => !item.children || item.children.length > 0 || item.path)
})
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
  transition: width var(--transition), background-color var(--transition);
  box-sizing: border-box;
}

.app-shell:has(.app-sidebar.collapsed) .app-header-left {
  width: var(--sidebar-w-collapsed);
  padding: 0 0.5rem;
  justify-content: center;
}

.app-shell:has(.app-sidebar.collapsed) .brand-container {
  display: none;
}

.brand-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  transition: background var(--transition), color var(--transition);
}

.toggle-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

.app-header-right {
  flex: 1;
  background: var(--theme-primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 1.25rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color var(--transition);
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
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #ffffff;
  white-space: nowrap;
}

/* Strips browser styling and adds seamless inline dropdown arrow */
.domain-dropdown {
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  
  background-color: transparent !important;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23ffffff' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") !important;
  background-repeat: no-repeat !important;
  background-position: right 60% !important;
  background-size: 8px 5px !important;

  color: #ffffff !important;
  font-family: inherit !important;
  font-size: 0.9rem !important;
  font-weight: 700 !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  
  height: auto !important;
  min-height: unset !important;
  max-height: unset !important;
  width: auto !important;
  padding: 0 14px 0 0 !important;
  margin: 0 !important;
  cursor: pointer;
  line-height: 1.2 !important;
  transform: translateY(1px);
}

.domain-dropdown option {
  background-color: #ffffff;
  color: #222222;
  font-size: 0.85rem;
  font-weight: normal;
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
  transition: background var(--transition), opacity var(--transition);
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
  transition: width var(--transition), background-color var(--transition);
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
  background: transparent;
  border-top: none;
  border-right: none;
  border-bottom: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
  text-align: left;
  box-sizing: border-box;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.nav-item--parent {
  justify-content: flex-start;
}

.arrow-btn {
  margin-left: auto;
  background: transparent;
  border: none;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: inherit;
  border-radius: 4px;
  transition: background 0.15s;
}

.arrow-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.nav-item--parent > .arrow-icon {
  margin-left: auto;
}

.arrow-icon {
  transition: transform var(--transition);
}

.arrow-icon.rotated {
  transform: rotate(180deg);
}

.nav-item--active {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-left-color: #fff;
  font-weight: 600;
}

.sub-menu {
  background: rgba(0, 0, 0, 0.1);
}

.nav-item--sub {
  padding-left: 2rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.75);
}

.nav-item--sub:hover {
  color: #fff;
}

.nav-icon {
  flex-shrink: 0;
}

.nav-label {
  font-size: 0.9rem;
  opacity: 1;
  transition: opacity var(--transition);
}

.app-sidebar.collapsed .nav-label,
.app-sidebar.collapsed .arrow-icon,
.app-sidebar.collapsed .sub-menu {
  display: none;
}

/* Main */
.app-main {
  grid-area: main;
  padding: 1.5rem;
  background: #f8fafc;
  min-height: 0;
}
</style>