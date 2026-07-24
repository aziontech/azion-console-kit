<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import CopilotFrame from '@/modules/azion-ai-chat/layout/copilot-frame.vue'

  defineOptions({
    name: 'Copilot-view'
  })

  const tagProps = {
    value: 'Preview',
    tooltip:
      'Copilot is in preview mode and can make mistakes. Consider verifying important information.'
  }
</script>

<template>
  <ContentBlock disablePadding>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Azion Copilot"
        data-testid="Copilot-heading"
        class="px-8 pt-8 mb-4"
        :isRightAlignment="true"
        :tag="tagProps"
        description="Provide AI-assisted insights and guidance across Azion’s products."
      >
      </PageHeadingBlock>
    </template>
    <template #content>
      <CopilotFrame />
    </template>
  </ContentBlock>
</template>
