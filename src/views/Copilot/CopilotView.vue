<script setup>
  import ContentBlock from '@/templates/content-block'
  // import Helper from './components/sidebar/helper.vue'
  // import helper from '@/layout/components/sidebar/helper.vue'
  import AzionAIChatBlock from '@/modules/azion-ai-chat/layout/view.vue'

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
      <AzionAIChatBlock />
    </template>
  </ContentBlock>
</template>
