<template>
  <IconButton
    @click="toggleSidebarComponent('helper')"
    icon="pi pi-question-circle"
    size="medium"
    kind="outlined"
    aria-label="Open help center"
    v-tooltip.bottom="{ value: 'Help', showDelay: 200 }"
  />
</template>

<script setup>
  import IconButton from '@aziontech/webkit/icon-button'
  import { useLayout } from '@/composables/use-layout'

  defineOptions({ name: 'ButtonHelper' })
  const { isSidebarActive, toggleSidebarComponent, activeComponentKey } = useLayout()
</script>
