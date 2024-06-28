<template>
  <PrimeButton
    :label="currentLabel"
    @click="openHelpCenter()"
    :pt="{
      label: { class: 'text-white' },
      icon: { class: 'text-white' }
    }"
    :class="{
      'bg-header hover:bg-header-button-hover': !helpCenterIsOpen,
      'bg-header-button-enabled': helpCenterIsOpen
    }"
    icon="pi pi-question-circle"
    size="small"
    class="text-white border-header"
    v-tooltip.bottom="{ value: 'Help', showDelay: 200 }"
  />
</template>

<script setup>
  import { computed, inject } from 'vue'
  import { useHelpCenterStore } from '@/stores/help-center'
  import { useAzionAiChatStore } from '@/stores/azion-ai-chat-store'
  import PrimeButton from 'primevue/button'

  defineOptions({ name: 'navbar-help-block' })

  const helpCenterStore = useHelpCenterStore()
  const askAzionAiChatStore = useAzionAiChatStore()
  const currentWidth = inject('currentWidth')
  const SCREEN_BREAKPOINT_MD = 768

  const openHelpCenter = () => {
    helpCenterStore.toggle()
    askAzionAiChatStore.close()
  }

  const currentLabel = computed(() => {
    if (currentWidth.value > SCREEN_BREAKPOINT_MD) {
      return 'Help'
    }
    return ''
  })

  const helpCenterIsOpen = computed(() => {
    return helpCenterStore.isOpen
  })
</script>
@/stores/azion-ai-chat-store
