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

const user = ref({})

const suggestionsOptions = ref([])
const hasSupport = ref(false)

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
  if (user.value.client_id) {
    const { isDeveloperSupportPlan } = await props.loadContractServicePlan({ clientId: user.value.client_id })
    hasSupport.value = !isDeveloperSupportPlan
  }
})
</script>

<template>
  <ContentBlock disablePadding>
    <template #heading>
      <PageHeadingBlock pageTitle="Azion Copilot" data-testid="Copilot-heading" class="px-8 pt-4"
        :isRightAlignment="true" tag="Preview">
      </PageHeadingBlock>
    </template>
    <template #content>
      <copilotView :user="user" :suggestionsOptions="suggestionsOptions">
        <template #chatSuggestions v-if="hasSupport">
          <div class="flex justify-center">
            <PrimeButton label="Open a support ticket" @click="openDocumentation" iconPos="right" link
              icon="pi pi-external-link" />
          </div>
        </template>
      </copilotView>
    </template>
  </ContentBlock>
</template>
