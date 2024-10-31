<script setup>
  import { useLayout } from '@/composables/use-layout'

  defineOptions({
    name: 'app-sidebar'
  })

  const { isSidebarActive, activeComponent } = useLayout()
</script>

<template>
  <div
    :class="[
      'border fixed flex flex-col min-h-screen pt-14 right-0 surface-border w-[32rem] transition-all duration-200 ease-in-out',
      isSidebarActive ? 'translate-x-0' : 'translate-x-full'
    ]"
  >
    <component :is="activeComponent" />
  </div>
</template>
