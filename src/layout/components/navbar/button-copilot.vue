<template>
  <PrimeButton
    :label="currentLabel"
    @click="toggleSidebarComponent('copilot')"
    class="text-white border-header"
    :pt="{
      root: { class: 'max-md:w-[2rem] max-md:h-[2rem] justify-content-center' },
      label: { class: 'max-md:hidden' },
      icon: { class: 'max-md:m-0' }
    }"
    :class="buttonClasses"
    v-if="showButton"
    icon="ai ai-ask-azion"
    size="small"
    v-tooltip.bottom="{ value: 'Help', showDelay: 200 }"
  />
</template>

<script setup>
  import { computed, inject } from 'vue'
  import PrimeButton from 'primevue/button'
  import { useLayout } from '@/composables/use-layout'
  import { useRoute } from 'vue-router'

  defineOptions({ name: 'ButtonCopilot' })
  const { isSidebarActive, toggleSidebarComponent, activeComponentKey } = useLayout()
  const currentWidth = inject('currentWidth')
  const SCREEN_BREAKPOINT_MD = 768

  const currentLabel = computed(() => {
    if (currentWidth.value > SCREEN_BREAKPOINT_MD) {
      return 'Copilot'
    }
    return ''
  })

  const route = useRoute()

  const showButton = computed(() => {
    return route.name !== 'copilot'
  })

  const buttonClasses = computed(() => {
    return isSidebarActive.value && activeComponentKey.value === 'copilot'
      ? 'bg-header-button-enabled'
      : 'bg-header hover:bg-header-button-hover'
  })
</script>
