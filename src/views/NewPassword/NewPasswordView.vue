<template>
  <div class="min-h-[calc(100vh-60px-56px)] sm:py-20 pt-4 pb-8 px-3">
    <ResetPassword :resetPasswordService="resetPasswordService"></ResetPassword>
  </div>
</template>

<script setup>
  import ResetPassword from '@/templates/sign-in-block/reset-password.vue'
  defineProps({
    resetPasswordService: {
      type: Function,
      required: true
    }
  })
</script>
