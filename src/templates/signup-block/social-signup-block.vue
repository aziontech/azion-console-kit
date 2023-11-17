<template>
  <div class="flex flex-col gap-4 animate-fadeIn">
    <PrimeButton
      label="Continue with Google"
      icon="pi pi-google"
      outlined
    />
    <PrimeButton
      label="Continue with Github"
      icon="pi pi-github"
      outlined
    />
  </div>
  <div class="w-full">
    <Divider
      layout="horizontal"
      align="center"
      >or</Divider
    >
  </div>
  <PrimeButton
    label="Sign Up with E-mail"
    outlined
    @click="$emit('change-signup-method')"
  />
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'

  defineEmits(['change-signup-method'])
</script>
