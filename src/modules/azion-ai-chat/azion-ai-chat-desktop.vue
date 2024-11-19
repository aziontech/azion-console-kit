<template>
  <AzionAiChatHeader>
    <template #header-actions>
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
        @click="azionAiChatStore.close()"
      />
    </template>
  </AzionAiChatHeader>

  <div class="overflow-y-auto sticky top-12 flex flex-col justify-between">
    <AzionAiChat :insert-deep-chat-styles="styleViewDeepChat" />
  </div>
</template>
<script setup>
  import AzionAiChatHeader from './azion-ai-chat-header-block.vue'
  import AzionAiChat from './azion-ai-chat-block.vue'
  import PrimeButton from 'primevue/button'
  import { windowOpen } from '@/helpers'
  import { useAzionAiChatStore } from '@/stores/azion-ai-chat-store'
  import { useRouter } from 'vue-router'

  const router = useRouter()
  const azionAiChatStore = useAzionAiChatStore()

  const styleViewDeepChat = {
    border: 'none'
  }

  const openChatInNewTab = () => {
    const url = `${window.location.origin}${router.resolve({ name: 'copilot' }).path}`
    windowOpen(url, '_blank')
  }
</script>
