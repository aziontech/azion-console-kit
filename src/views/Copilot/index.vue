<script setup>
  import ContentBlock from '@/templates/content-block'
  import copilotView from '@/modules/azion-ai-chat/layout/view'
  import PageHeadingBlock from '@/templates/page-heading-block'

  defineOptions({
    name: 'Copilot-view'
  })
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
      <copilotView />
    </template>
  </ContentBlock>
</template>
