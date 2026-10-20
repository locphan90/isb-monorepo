<script setup>
// Layout riêng cho sinh viên. app.vue đã có <v-app> và snackbar toàn cục nên ở đây dùng div thường.
const { user } = useUserSession()
const { signOut } = useStudentSelfProfile()
</script>

<template>
  <div class="student-shell">
    <header class="student-header">
      <img src="/LogoISB.png" alt="ISB Logo" class="student-logo" />
      <div class="student-header-right">
        <span class="student-name">{{ user?.name }}</span>
        <button class="signout-btn" title="Sign out" @click="signOut">
          <AppIcon name="mdiLogout" :size="20" />
        </button>
      </div>
    </header>

    <main class="student-main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.student-shell {
  min-height: 100vh;
  background: #f8fafc;
}

.student-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 1.25rem;
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.student-logo {
  height: 36px;
  width: auto;
  object-fit: contain;
}

.student-header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.student-name {
  font-size: 0.9rem;
  font-weight: 600;
}

.signout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #5f6368;
  cursor: pointer;
}

.signout-btn:hover {
  background: rgba(60, 64, 67, 0.08);
}

.student-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}
</style>
