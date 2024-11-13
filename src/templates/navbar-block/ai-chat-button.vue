<template>
  <PrimeButton
    @click="openAiChat"
    size="small"
    class="special-button"
    v-tooltip.bottom="{ value: 'Copilot', showDelay: 200 }"
  >
    <div
      class="special-button-content shadow !shadow-[#ffffff50]"
      :class="{
        'bg-header/80 hover:bg-[#00000025]': !aiChatIsOpen,
        'bg-header/40': aiChatIsOpen
      }"
    >
      <i class="ai ai-ask-azion"></i>{{ currentLabel }}
    </div>
  </PrimeButton>
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
