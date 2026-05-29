<template>
  <SocialIdpsBlock direction="bottom-to-top" />
  <PrimeButton
    kind="outlined"
    size="medium"
    label="Sign Up with Email"
    @click="handleSignUpEmailClick"
  />
</template>

<script setup>
  import PrimeButton from '@aziontech/webkit/button'
  import SocialIdpsBlock from '@/templates/social-idps-block'
  import { useAccountStore } from '@/stores/account'
  const emit = defineEmits(['change-signup-method'])

  const handleSignUpEmailClick = () => {
    const accountStore = useAccountStore()
    accountStore.resetSsoSignUpMethod()
    emit('change-signup-method')
  }
</script>
