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
    <template #heading>
      <PageHeadingBlock pageTitle="Azion AI">
        <template #default>
          <PrimeButton
            severity="primary"
            :label="'New Chat'"
            icon="pi pi-pen-to-square"
            @click="handleClearChat"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <InlineMessage
        class="w-fit mb-8"
        severity="info"
        >Azion AI is in experimental mode and can give you some wrong answers. Please, always
        validate your answers.
      </InlineMessage>
      <AzionAiChatFullSizeBlock ref="azionAiChat" />
    </template>
  </ContentBlock>
</template>
