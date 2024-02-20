<template>
  <FeedbackFish :projectId="projectId" />

  <PrimeButton
    :label="currentLabel"
    data-feedback-fish
    :data-feedback-fish-userid="user.email"
    :pt="{
      label: { class: 'text-white' },
      icon: { class: 'text-white' }
    }"
    icon="pi pi-flag"
    size="small"
    class="text-white border-header bg-header hover:bg-header-button-hover"
    v-tooltip.bottom="{ value: 'Feedback', showDelay: 200 }"
  />
</template>

<script setup>
  import { computed, inject } from 'vue'
  import { FeedbackFish } from '@feedback-fish/vue'
  import { useAccountStore } from '@/stores/account'
  import PrimeButton from 'primevue/button'

  const projectId = '2566aa41e7e334'

  const SCREEN_BREAKPOINT_MD = 768
  const currentWidth = inject('currentWidth')
  const user = useAccountStore().accountData

  const currentLabel = computed(() => {
    if (currentWidth.value > SCREEN_BREAKPOINT_MD) {
      return 'Feedback'
    }
    return ''
  })
</script>
