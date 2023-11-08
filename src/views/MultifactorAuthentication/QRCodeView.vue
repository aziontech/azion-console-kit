<template>
  <MfaSetupBlock
    :validateMfaCodeService="validateMfaCodeService"
    :generateQrCodeMfaService="generateQrCodeMfaService"
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
    }
  })
</script>
