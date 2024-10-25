<script setup>
  import { useLayout } from '@/composables/use-layout'
  import Helper from './components/sidebar/helper.vue'

  const { isSidebarActive } = useLayout()
</script>

<template>
  <div
    :class="[
      'border fixed flex flex-col min-h-screen pt-14 right-0 surface-border transition-transform w-[32rem] duration-200',
      isSidebarActive ? 'translate-x-0' : 'translate-x-full'
    ]"
  >
    <Helper />
  </div>
</template>
