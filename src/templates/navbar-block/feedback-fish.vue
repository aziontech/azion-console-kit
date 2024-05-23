<template>
  <FeedbackFish :projectId="projectId" />

  <PrimeButton
    label="Feedback"
    data-feedback-fish
    :data-feedback-fish-userid="user.email"
    :pt="{
      root: { class: 'max-md:w-[2rem] max-md:h-[2rem] justify-content-center' },
      label: { class: 'max-md:hidden' },
      icon: { class: 'max-md:m-0' }
    }"
    icon="pi pi-flag"
    size="small"
    :outlined="props.outlined"
    :class="props.class"
    v-tooltip.bottom="{ value: 'Feedback', showDelay: 200 }"
  />
</template>

<script setup>
  import { FeedbackFish } from '@feedback-fish/vue'
  import { useAccountStore } from '@/stores/account'
  import PrimeButton from 'primevue/button'

  const projectId = '2566aa41e7e334'

  const props = defineProps({
    class: {
      type: String
    },
    outlined: {
      type: Boolean,
      default: true
    }
  })

  const user = useAccountStore().accountData
</script>
