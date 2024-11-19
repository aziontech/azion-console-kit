<script setup>
  import ContentBlock from '@/templates/content-block'
  import AzionAiChatFullSizeBlock from '@/modules/azion-ai-chat/azion-ai-chat-full-size-block.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
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
      <AzionAiChatFullSizeBlock class="surface-border border" />
    </template>
  </ContentBlock>
</template>
