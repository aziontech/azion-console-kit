<template>
  <PrimeButton
    :label="currentLabel"
    @click="openAiChat()"
    :pt="{
      label: { class: 'text-white' },
      icon: { class: 'text-white' }
    }"
    :class="{
      'bg-header hover:bg-header-button-hover': !aiChatIsOpen,
      'bg-header-button-enabled': aiChatIsOpen
    }"
    icon="ai ai-ask-azion"
    size="small"
    class="text-white border-header"
    v-tooltip.bottom="{ value: 'Copilot', showDelay: 200 }"
  />
</template>

<script setup>
  import { computed, inject } from 'vue'
  import { useAzionAiChatStore } from '@/stores/azion-ai-chat-store'
  import { useHelpCenterStore } from '@/stores/help-center'

  import PrimeButton from 'primevue/button'
  import router from '@/router'

  defineOptions({ name: 'ai-chat-button' })

  const askAzionAiChatStore = useAzionAiChatStore()
  const helpCenterStore = useHelpCenterStore()
  const currentWidth = inject('currentWidth')
  const SCREEN_BREAKPOINT_MD = 768

  const openAiChat = () => {
    helpCenterStore.close()
    if (router.resolve({ name: 'copilot' }).path === router.currentRoute.value.path) {
      return
    }
    askAzionAiChatStore.toggle()
  }

  const currentLabel = computed(() => {
    if (currentWidth.value > SCREEN_BREAKPOINT_MD) {
      return 'Copilot'
    }
    return ''
  })

  const aiChatIsOpen = computed(() => {
    return askAzionAiChatStore.isOpen ? 'active-helper' : ''
  })
</script>
