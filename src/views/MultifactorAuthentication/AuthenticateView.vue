<template>
  <MfaAuthenticateBlock
    :validateMfaCodeService="validateMfaCodeService"
    :verifyAuthenticationService="verifyAuthenticationService"
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
    }
  })
</script>
