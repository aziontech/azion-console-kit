<script setup>
  import ContentBlock from '@/templates/content-block'
  import copilotView from '@/modules/azion-ai-chat/layout/view'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { useAccountStore } from '@/stores/account'
  import { loadPromptSuggestion } from '@/modules/azion-ai-chat/services/load-prompt-suggestions'
  import { ref, watchEffect } from 'vue'

  defineOptions({
    name: 'Copilot-view'
  })

  const user = ref({
    name: '',
    id: ''
  })
  const suggestionsOptions = ref([])

  const loadPromptSuggestionWithRoleDecorator = (role) => {
    suggestionsOptions.value = loadPromptSuggestion(role)
  }

  watchEffect(() => {
    const { account } = useAccountStore()

    user.value.name = account.name
    user.value.id = account.client_id

    loadPromptSuggestionWithRoleDecorator(account.jobRole)
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
      <copilotView
        :user="user"
        :suggestionsOptions="suggestionsOptions"
      />
    </template>
  </ContentBlock>
</template>
