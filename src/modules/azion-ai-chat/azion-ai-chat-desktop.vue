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

  <div
    class="overflow-y-auto sticky top-12 h-[calc(100vh-5rem)] flex flex-col justify-between"
    v-if="isChatMobile"
  >
    <AzionAiChat
      :key="renderCount"
      ref="azionAiChatRef"
      :insert-deep-chat-styles="styleViewDeepChat"
    />
  </div>
</template>
<script setup>
  import AzionAiChatHeader from './azion-ai-chat-header-block.vue'
  import AzionAiChat from './azion-ai-chat-block.vue'
  import PrimeButton from 'primevue/button'

  const styleViewDeepChat = {
    border: 'none'
  }
</script>
