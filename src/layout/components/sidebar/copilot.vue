<script setup>
  import PrimeButton from 'primevue/button'
  import { useLayout } from '@/composables/use-layout'
  import AzionAIChatBlock from '@/modules/azion-ai-chat/layout'
  import { useRouter } from 'vue-router'
  import { ref, watch, watchEffect } from 'vue'
  import { useAccountStore } from '@/stores/account'
  import { loadPromptSuggestion } from '@/modules/azion-ai-chat/services/load-prompt-suggestions'
  import { openContactSupport } from '@/helpers'

  defineOptions({
    name: 'copilot-sidebar'
  })

  const { closeSidebar, activeComponent } = useLayout()
  const router = useRouter()

  const openChatInNewTab = () => {
    router.push({ name: 'copilot' })
  }

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
    hasSupport.value = !account.isDeveloperSupportPlan
  })

  watch(
    () => router.currentRoute.value.name,
    (name) => {
      if (name === 'copilot') {
        closeSidebar()
      }
    }
  )
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-3.5rem)]">
    <AzionAIChatBlock
      :user="user"
      :suggestionsOptions="suggestionsOptions"
      :invokeClearChat="activeComponent.props?.clearChat"
    >
      <template #chatControls="{ clearChat }">
        <div class="flex gap-2">
          <PrimeButton
            icon="pi pi-eraser"
            outlined
            class="surface-border h-8 w-8"
            aria-label="New chat"
            v-tooltip.bottom="'New chat'"
            @click="clearChat"
          />
          <PrimeButton
            icon="pi pi-window-maximize"
            outlined
            class="surface-border h-8 w-8"
            aria-label="Expand chat to full page"
            v-tooltip.bottom="'Expand chat to full page'"
            @click="openChatInNewTab"
          />
          <PrimeButton
            icon="pi pi-times"
            outlined
            class="surface-border h-8 w-8"
            aria-label="Close"
            v-tooltip.bottom="'Close'"
            @click="closeSidebar"
          />
        </div>
      </template>
      <template
        #chatSuggestions
        v-if="hasSupport"
      >
        <PrimeButton
          label="Open a support ticket"
          @click="openContactSupport"
          iconPos="right"
          link
          icon="pi pi-external-link"
        />
      </template>
    </AzionAIChatBlock>
  </div>
</template>
