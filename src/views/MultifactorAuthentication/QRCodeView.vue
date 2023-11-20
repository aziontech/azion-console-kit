<template>
  <MfaSetupBlock
    :validateMfaCodeService="validateMfaCodeService"
    :generateQrCodeMfaService="generateQrCodeMfaService"
    :verifyAuthenticationService="verifyAuthenticationService"
  />
</template>

<script setup>
  import MfaSetupBlock from '@/templates/mfa-setup-block'

  defineProps({
    generateQrCodeMfaService: {
      required: true,
      type: Function
    },
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
