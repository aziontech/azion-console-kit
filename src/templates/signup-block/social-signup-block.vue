<template>
  <SocialIdpsBlock
    :socialIdpsService="iamService.listSocialIdps"
    direction="bottom-to-top"
  />
  <PrimeButton
    label="Sign Up with Email"
    outlined
    @click="handleSignUpEmailClick"
  />
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import SocialIdpsBlock from '@/templates/social-idps-block'
  import { useAccountStore } from '@/stores/account'
  import { iamService } from '@/services/v2'
  const emit = defineEmits(['change-signup-method'])

  const handleSignUpEmailClick = () => {
    const accountStore = useAccountStore()
    accountStore.resetSsoSignUpMethod()
    emit('change-signup-method')
  }
</script>
