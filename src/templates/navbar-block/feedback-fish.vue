<template>
  <FeedbackFish :projectId="projectId" />

  <PrimeButton
    label="Feedback"
    data-feedback-fish
    :data-feedback-fish-userid="user.email"
    :pt="{
      root: { class: 'max-md:w-[2rem] max-md:h-[2rem] justify-content-center' },
      label: { class: 'text-white max-md:hidden' },
      icon: { class: 'text-white max-md:m-0' }
    }"
    icon="pi pi-flag"
    size="small"
    class="text-white border-header bg-header hover:bg-header-button-hover"
    v-tooltip.bottom="{ value: 'Feedback', showDelay: 200 }"
  />
</template>

<script setup>
  import { FeedbackFish } from '@feedback-fish/vue'
  import { useAccountStore } from '@/stores/account'
  import PrimeButton from 'primevue/button'

  const projectId = '2566aa41e7e334'

  const user = useAccountStore().accountData
</script>
