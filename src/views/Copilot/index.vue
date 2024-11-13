<script setup>
  import ContentBlock from '@/templates/content-block'
  import copilotView from '@/modules/azion-ai-chat/layout/view'
  import PrimeButton from 'primevue/button'
  import PrimeTag from 'primevue/tag'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { useAccountStore } from '@/stores/account'
  import { loadPromptSuggestion } from '@/modules/azion-ai-chat/services/load-prompt-suggestions'
  import { ref, watchEffect } from 'vue'

  defineOptions({
    name: 'Copilot-view'
  })

  const props = defineProps({
    loadContractServicePlan: Function
  })

  const user = ref({
    name: '',
    id: ''
  })

  const suggestionsOptions = ref([])
  const result = ref()

  const loadPromptSuggestionWithRoleDecorator = (role) => {
    suggestionsOptions.value = loadPromptSuggestion(role)
  }

  watchEffect(async () => {
    const { account } = useAccountStore()

    user.value.name = account.name
    user.value.id = account.client_id
    user.value.email = account.email
    user.value.first_name = account.first_name
    user.value.last_name = account.last_name

    //     "id": 34130,

    loadPromptSuggestionWithRoleDecorator(account.jobRole)
    if (user.value.id) {
      result.value = await props.loadContractServicePlan({ clientId: user.value.id })
      console.log(result.value)
    }
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
      >
        <template #default>
          <PrimeTag value="Preview" />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <copilotView
        :user="user"
        :suggestionsOptions="suggestionsOptions"
      >
        <template #chatSuggestions>
          <PrimeButton
            label="Open a support ticket"
            @click="openDocumentation"
            iconPos="right"
            link
            icon="pi pi-external-link"
          />
        </template>
      </copilotView>
    </template>
  </ContentBlock>
</template>
