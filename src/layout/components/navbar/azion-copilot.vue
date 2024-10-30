<template>
  <PrimeButton
    :label="currentLabel"
    @click="toggleSidebar"
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
  import { computed, inject } from 'vue'
  import PrimeButton from 'primevue/button'
  import { useLayout } from '@/composables/use-layout'

  defineOptions({ name: 'NavbarHelpBlock' })
  const { isSidebarActive, toggleSidebar } = useLayout()
  const currentWidth = inject('currentWidth')
  const SCREEN_BREAKPOINT_MD = 768

  const currentLabel = computed(() => {
    if (currentWidth.value > SCREEN_BREAKPOINT_MD) {
      return 'Copilot'
    }
    return ''
  })

  const buttonClasses = computed(() => {
    return isSidebarActive.value
      ? 'bg-header-button-enabled'
      : 'bg-header hover:bg-header-button-hover'
  })
</script>
