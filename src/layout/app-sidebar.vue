<script setup>
  import { useLayout } from '@/composables/use-layout'
  import Sidebar from 'primevue/sidebar'

  defineOptions({
    name: 'app-sidebar'
  })

  const { isSidebarActive, activeComponent, isVisibleMobileSidebar } = useLayout()
</script>

<template>
  <div
    :class="[
      'border fixed flex flex-col min-h-screen pt-14 right-0 surface-border w-[32rem] transition-all duration-200 ease-in-out',
      isSidebarActive && isVisibleMobileSidebar ? 'translate-x-0' : 'translate-x-full'
    ]"
    v-if="isSidebarActive && isVisibleMobileSidebar"
  >
    <component :is="activeComponent" />
  </div>

  <Sidebar
    :visible="isSidebarActive && !isVisibleMobileSidebar"
    position="bottom"
    :show-close-icon="false"
    block-scroll="body"
    :pt="{
      root: { class: '!h-[90%] flex' },
      mask: { class: 'flex' },
      content: { class: '!p-0' }
    }"
  >
    <template #container>
      <component :is="activeComponent" />
    </template>
  </Sidebar>
</template>
