<template>
  <PrimeButton
    label="Help"
    @click="toggleHelpCenter"
    class="text-white border-header"
    :pt="{
      root: { class: 'max-md:w-[2rem] max-md:h-[2rem] justify-content-center' },
      label: { class: 'max-md:hidden' },
      icon: { class: 'max-md:m-0' }
    }"
    :class="buttonClasses"
    icon="ai ai-ask-azion"
    size="small"
    v-tooltip.bottom="{ value: 'Help', showDelay: 200 }"
  />
</template>

<script setup>
  import { computed } from 'vue'
  import { useHelpCenterStore } from '@/stores/help-center'
  import PrimeButton from 'primevue/button'

  defineOptions({ name: 'NavbarHelpBlock' })

  const helpCenterStore = useHelpCenterStore()

  const toggleHelpCenter = () => {
    helpCenterStore.toggle()
  }

  const buttonClasses = computed(() => {
    return helpCenterStore.isOpen
      ? 'bg-header-button-enabled'
      : 'bg-header hover:bg-header-button-hover'
  })
</script>
