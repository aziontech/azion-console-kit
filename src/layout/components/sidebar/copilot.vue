<script setup>
  import PrimeButton from 'primevue/button'
  import { useLayout } from '@/composables/use-layout'
  import AzionAIChatBlock from '@/modules/azion-ai-chat/layout'
  import { useRouter } from 'vue-router'

  defineOptions({
    name: 'copilot-sidebar'
  })

  const { closeSidebar } = useLayout()
  const router = useRouter()

  const openChatInNewTab = () => {
    router.push({ name: 'copilot' })
  }
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-3.5rem)]">
    <AzionAIChatBlock>
      <template #chatControls="{ clearChat }">
        <div class="flex gap-3">
          <PrimeButton
            icon="pi pi-eraser"
            outlined
            class="surface-border h-8 w-8"
            aria-label="Clear chat"
            v-tooltip.bottom="'Clear chat'"
            @click="clearChat"
          />
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
            v-tooltip.bottom="'Close'"
            @click="closeSidebar"
          />
        </div>
      </template>
    </AzionAIChatBlock>
  </div>
</template>
