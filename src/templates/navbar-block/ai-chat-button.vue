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
    icon="pi pi-sparkles"
    size="small"
    class="text-white border-header"
    v-tooltip.bottom="{ value: 'Ask Azion', showDelay: 200 }"
  />
</template>

<script setup>
  import { computed, inject } from 'vue'
  import { useAskAzionAiChatStore } from '@/stores/ask-azion-ai-chat'
  import { useHelpCenterStore } from '@/stores/help-center'

  import PrimeButton from 'primevue/button'

  defineOptions({ name: 'ai-chat-button' })

  const askAzionAiChatStore = useAskAzionAiChatStore()
  const helpCenterStore = useHelpCenterStore()
  const currentWidth = inject('currentWidth')
  const SCREEN_BREAKPOINT_MD = 768

  const openAiChat = () => {
    askAzionAiChatStore.toggle()
    helpCenterStore.close()
  }

  const currentLabel = computed(() => {
    if (currentWidth.value > SCREEN_BREAKPOINT_MD) {
      return 'Ask Azion'
    }
    return ''
  })

  const aiChatIsOpen = computed(() => {
    return askAzionAiChatStore.isOpen ? 'active-helper' : ''
  })
</script>
