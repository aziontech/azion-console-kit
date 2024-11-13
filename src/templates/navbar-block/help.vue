<template>
  <PrimeButton
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
  import { computed } from 'vue'
  import { useHelpCenterStore } from '@/stores/help-center'
  import { useAzionAiChatStore } from '@/stores/azion-ai-chat-store'
  import PrimeButton from 'primevue/button'

  defineOptions({ name: 'navbar-help-block' })

  const helpCenterStore = useHelpCenterStore()
  const askAzionAiChatStore = useAzionAiChatStore()

  const openHelpCenter = () => {
    helpCenterStore.toggle()
    askAzionAiChatStore.close()
  }

  const helpCenterIsOpen = computed(() => {
    return helpCenterStore.isOpen
  })
</script>
