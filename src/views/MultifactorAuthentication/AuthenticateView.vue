<template>
  <MfaAuthenticateBlock
    :validateMfaCodeService="validateMfaCodeService"
    :verifyAuthenticationService="verifyAuthenticationService"
    :accountHandler="accountHandler"
  />
</template>

<script setup>
  import MfaAuthenticateBlock from '@/templates/mfa-authenticate-block'

  defineProps({
    validateMfaCodeService: {
      required: true,
      type: Function
    },
    verifyAuthenticationService: {
      required: true,
      type: Function
    },
    accountHandler: {
      required: true,
      type: Object
    }
  })
</script>
