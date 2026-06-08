<template>
  <IconButton
    @click="toggleSidebarComponent('helper')"
    :class="buttonClasses"
    icon="pi pi-question-circle"
    size="small"
    aria-label="Open help center"
    v-tooltip.bottom="{ value: 'Help', showDelay: 200 }"
    class="text-white border-header bg-header hover:bg-header-button-hover"
  />
</template>

<script setup>
  import { computed } from 'vue'
  import IconButton from '@aziontech/webkit/icon-button'
  import { useLayout } from '@/composables/use-layout'

  defineOptions({ name: 'ButtonHelper' })
  const { isSidebarActive, toggleSidebarComponent, activeComponentKey } = useLayout()

  const buttonClasses = computed(() => {
    return isSidebarActive.value && activeComponentKey.value === 'helper'
      ? 'bg-header-button-enabled'
      : 'bg-header hover:bg-header-button-hover'
  })
</script>
