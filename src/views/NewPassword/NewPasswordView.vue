<template>
  <div>
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
