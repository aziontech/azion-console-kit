<script setup>
  import ContentBlock from '@/templates/content-block'
  import AzionAiChatFullSizeBlock from '@/modules/azion-ai-chat/azion-ai-chat-full-size-block.vue'
  import PrimeButton from 'primevue/button'
  import { ref } from 'vue'
  import PageHeadingBlock from '@/templates/page-heading-block'

  const azionAiChat = ref(null)
  const handleClearChat = () => {
    azionAiChat?.value.handleClearChat()
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Copilot"
        data-testid="Copilot-heading"
      />
    </template>
    <template #content>
      <div class="fixed z-10 right-24 bottom-[75px] max-sm:bottom-[95px] max-sm:right-[72px]">
        <PrimeButton
          text
          v-tooltip.top="{ value: 'Start a new chat', showDelay: 200 }"
          icon="pi pi-pen-to-square"
          @click="handleClearChat"
        />
      </div>

      <AzionAiChatFullSizeBlock
        ref="azionAiChat"
        class="surface-border border"
      />
    </template>
  </ContentBlock>
</template>
