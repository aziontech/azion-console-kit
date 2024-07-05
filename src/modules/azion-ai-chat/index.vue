<template>
  <div
    :style="{ 'background-color': 'var(--surface-section)' }"
    class="hidden flex-col w-full surface-border border-l h-[100ldh] transform translate-x-full transition-transform duration-300 ease-in-out sm:w-[500px] 2xl:w-[800px]"
  >
    <AzionAiChatHeader>
      <template #header-actions>
        <PrimeButton
          icon="pi pi-pen-to-square"
          outlined
          class="surface-border h-8 w-8"
          aria-label="New Chat"
          v-tooltip.bottom="'New Chat'"
          @click="handleClearChat"
        />
        <PrimeButton
          icon="pi pi-times"
          outlined
          class="surface-border h-8 w-8"
          aria-label="Close"
          @click="azionAiChatStore.close()"
        />
      </template>
    </AzionAiChatHeader>

    <div
      class="h-full flex justify-between flex-col"
      :key="renderCount"
    >
      <AzionAiChat ref="azionAiChatRef" />
    </div>
    <Sidebar
      :visible="isChatAiOpen"
      position="bottom"
      headerContent="Azion AI"
      :show-close-icon="false"
      :pt="{
        root: { class: '!h-[100%] md:hidden flex' },
        headerContent: { class: 'w-full' },
        mask: { class: 'md:hidden flex' },
        content: { class: '!p-0' }
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="flex items-center gap-2">
            Azion AI

            <PrimeTag
              class="ml-2"
              value="Experimental"
              v-tooltip.bottom="
                'Azion AI is in experimental mode and can give you some wrong answers. Please, always validate your answers.'
              "
              severity="info"
            />
          </h2>
          <div class="gap-4 flex">
            <PrimeButton
              icon="pi pi-pen-to-square"
              outlined
              class="surface-border h-8 w-8"
              aria-label="New Chat"
              v-tooltip.bottom="'New Chat'"
              @click="handleClearChat"
            />
            <PrimeButton
              icon="pi pi-times"
              @click="azionAiChatStore.close()"
              size="small"
              class="flex-none surface-border text-sm w-8 h-8"
              text
            />
          </div>
        </div>
      </template>

      <div class="h-full w-full justify-between flex flex-col">
        <AzionAiChat
          :key="renderCount"
          ref="azionAiChatMobileRef"
        />
      </div>
    </Sidebar>
  </div>
</template>

<script setup>
  import PrimeTag from 'primevue/tag'
  import Sidebar from 'primevue/sidebar'
  import PrimeButton from 'primevue/button'
  import AzionAiChatHeader from './azion-ai-chat-header-block.vue'
  import AzionAiChat from './azion-ai-chat-block.vue'

  import { useAzionAiChatStore } from '@/stores/azion-ai-chat-store'
  import { updateSessionId } from './services/make-session-id'
  import { computed, onMounted, ref } from 'vue'
  import hljs from 'highlight.js'

  defineOptions({
    name: 'azion-ai-chat-root-block'
  })
  const azionAiChatRef = ref(null)
  const azionAiChatMobileRef = ref(null)
  const renderCount = ref(1)
  onMounted(() => {
    addSupportToHljs()
  })

  const azionAiChatStore = useAzionAiChatStore()
  const isChatAiOpen = computed(() => {
    return azionAiChatStore.isOpen
  })

  const addSupportToHljs = () => {
    if (!window.hljs) {
      window.hljs = hljs
    }
  }

  const updateChatRenderInstance = () => {
    renderCount.value += 1
  }

  const handleClearChat = () => {
    azionAiChatRef?.value.deepChatRef.clearMessages()
    azionAiChatMobileRef?.value.deepChatRef.clearMessages()
    updateSessionId()
    updateChatRenderInstance()
  }
</script>
