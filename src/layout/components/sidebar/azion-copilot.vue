<script setup>
  import PrimeButton from 'primevue/button'
  import { useLayout } from '@/composables/use-layout'
  import AzionAIChatBlock from '@/modules/azion-ai-chat/layout'

  defineOptions({
    name: 'helper-sidebar'
  })

  const { toggleSidebar } = useLayout()
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-3.5rem)]">
    <AzionAIChatBlock>
      <template #chatControls>
        <div class="flex gap-3">
          <PrimeButton
            icon="pi pi-external-link"
            outlined
            class="surface-border h-8 w-8"
            aria-label="Open a chat in new tab"
            v-tooltip.bottom="'Open a chat in new tab'"
            @click="openChatInNewTab"
          />
          <PrimeButton
            icon="pi pi-times"
            outlined
            class="surface-border h-8 w-8"
            aria-label="Close"
            @click="toggleSidebar"
          />
        </div>
      </template>
    </AzionAIChatBlock>
  </div>
</template>
