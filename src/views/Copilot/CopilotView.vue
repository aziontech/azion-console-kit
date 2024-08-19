<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import AzionAiChatFullSizeBlock from '@/modules/azion-ai-chat/azion-ai-chat-full-size-block.vue'
  import PrimeButton from 'primevue/button'
  import { ref } from 'vue'
  import InlineMessage from 'primevue/inlinemessage'

  const azionAiChat = ref(null)
  const handleClearChat = () => {
    azionAiChat?.value.handleClearChat()
  }
</script>

<template>
  <ContentBlock>
    <template #content>
      <div class="fixed z-10 right-24 bottom-[100px] max-sm:bottom-[112px] max-sm:right-[72px]">
        <PrimeButton
          text
          v-tooltip.top="{ value: 'Start a new chat', showDelay: 200 }"
          icon="pi pi-pen-to-square"
          @click="handleClearChat"
        />
      </div>
      <AzionAiChatFullSizeBlock ref="azionAiChat" />

      <InlineMessage
        class="w-fit mt-4"
        severity="info"
        >Copilot is in experimental mode and can give you some wrong answers. Please, always
        validate your answers.
      </InlineMessage>
    </template>
  </ContentBlock>
</template>
