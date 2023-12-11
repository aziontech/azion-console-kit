<template>
  <AccountActivation :resendEmailService="resendEmailService" />
</template>

<script setup>
  import AccountActivation from '@/templates/signup-block/account-activation.vue'

  defineProps({
    resendEmailService: {
      required: true,
      type: Function
    }
  })
</script>
