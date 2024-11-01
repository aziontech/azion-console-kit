<template>
  <PrimeButton
    @click="toggleSidebarComponent('helper')"
    class="text-white border-header bg-header hover:bg-header-button-hover"
    :pt="{
      root: { class: 'max-md:w-[2rem] max-md:h-[2rem] justify-content-center' },
      label: { class: 'max-md:hidden' },
      icon: { class: 'max-md:m-0 text-white' }
    }"
    :class="buttonClasses"
    icon="pi pi-question-circle"
    size="small"
    v-tooltip.bottom="{ value: 'Help', showDelay: 200 }"
  />
</template>

<script setup>
  import { computed } from 'vue'
  import PrimeButton from 'primevue/button'
  import { useLayout } from '@/composables/use-layout'

  defineOptions({ name: 'ButtonHelper' })
  const { isSidebarActive, toggleSidebarComponent, activeComponentKey } = useLayout()

  const buttonClasses = computed(() => {
    return isSidebarActive.value && activeComponentKey.value === 'helper'
      ? 'bg-header-button-enabled'
      : 'bg-header hover:bg-header-button-hover'
  })
</script>
