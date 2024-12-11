<script setup>
  import ContentBlock from '@/templates/content-block'
  import copilotView from '@/modules/azion-ai-chat/layout/view'
  import PrimeButton from 'primevue/button'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { useAccountStore } from '@/stores/account'
  import { loadPromptSuggestion } from '@/modules/azion-ai-chat/services/load-prompt-suggestions'
  import { ref, watchEffect } from 'vue'
  import { openContactSupport } from '@/helpers'

  defineOptions({
    name: 'Copilot-view'
  })

  const user = ref({})

  const suggestionsOptions = ref([])
  const hasSupport = ref(false)
  const tagProps = {
    value: 'Preview',
    tooltip:
      'Copilot is in preview mode and can make mistakes. Consider verifying important information.'
  }

  const loadPromptSuggestionWithRoleDecorator = (role) => {
    suggestionsOptions.value = loadPromptSuggestion(role)
  }

  watchEffect(async () => {
    const { account } = useAccountStore()

    user.value = {
      name: account.name,
      client_id: account.client_id,
      email: account.email,
      first_name: account.first_name,
      last_name: account.last_name,
      id: account.id
    }

    loadPromptSuggestionWithRoleDecorator(account.jobRole)
    hasSupport.value = !account.isDeveloperSupportPlan
  })
</script>

<template>
  <ContentBlock disablePadding>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Azion Copilot"
        data-testid="Copilot-heading"
        class="px-8 pt-4"
        :isRightAlignment="true"
        :tag="tagProps"
      >
      </PageHeadingBlock>
    </template>
    <template #content>
      <copilotView
        :user="user"
        :suggestionsOptions="suggestionsOptions"
      >
        <template
          #chatSuggestions
          v-if="hasSupport"
        >
          <div class="flex justify-center">
            <PrimeButton
              label="Open a support ticket"
              @click="openContactSupport"
              iconPos="right"
              size="small"
              link
              icon="pi pi-external-link"
            />
          </div>
        </template>
      </copilotView>
    </template>
  </ContentBlock>
</template>
