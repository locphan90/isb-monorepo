<!-- Request: các yêu cầu của sinh viên (bổ sung sau). Trang giữ chỗ để menu hoạt động. -->
<template>
  <div class="request-page">
    <div class="card">
      <p class="title">Requests are coming soon</p>
      <p class="hint">You will be able to submit and track your requests here.</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'student', title: 'Request' })
</script>

<style scoped>
.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 2.5rem 1rem; text-align: center; }
.title { margin: 0 0 4px; font-weight: 700; color: #334155; }
.hint { margin: 0; font-size: 0.9rem; color: #64748b; }
</style>
