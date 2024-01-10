<template>
  <SocialIdpsBlock
    :socialIdpsService="listSocialIdpsService"
    direction="bottom-to-top"
  />
  <PrimeButton
    label="Sign Up with Email"
    outlined
    @click="$emit('change-signup-method')"
  />
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import SocialIdpsBlock from '@/templates/social-idps-block'

  defineEmits(['change-signup-method'])

  defineProps({
    listSocialIdpsService: {
      type: Function,
      required: true
    }
  })
</script>
