<template>
  <div
    :style="{ 'background-color': 'var(--surface-section)' }"
    class="hidden flex-col w-full surface-border border-l h-[100ldh] transform translate-x-full transition-transform duration-300 ease-in-out sm:w-[500px] 2xl:w-[800px]"
  >
    <AzionAiChatHeader>
      <template #header-actions>
        <PrimeButton
          icon="pi pi-external-link"
          outlined
          class="surface-border h-8 w-8"
          aria-label="Open a chat in new tab"
          v-tooltip.bottom="'Open a chat in new tab'"
          @click="openChatInNewTab"
        />
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
      v-if="isChatMobile"
    >
      <AzionAiChat
        :key="renderCount"
        ref="azionAiChatRef"
      />
    </div>
    <Sidebar
      v-else
      :visible="isChatAiOpen"
      position="bottom"
      headerContent="Copilot"
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
            Copilot
            <PrimeTag
              class="ml-2"
              value="Experimental"
              v-tooltip.bottom="
                'Copilot is in experimental mode and can give you some wrong answers. Please, always validate your answers.'
              "
              severity="info"
            />
          </h2>
          <div class="gap-4 flex">
            <PrimeButton
              icon="pi pi-external-link"
              outlined
              class="surface-border h-8 w-8"
              aria-label="Open a chat in new tab"
              v-tooltip.bottom="'Open a chat in new tab'"
              @click="openChatInNewTab"
            />
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
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import hljs from 'highlight.js'
  import { AZION_MESSAGE_TYPE } from '@modules/azion-ai-chat/directives/custom-ai-prompt'
  import { useRouter } from 'vue-router'
  import { windowOpen } from '@/helpers'
  import { useWindowSize } from '@vueuse/core'

  defineOptions({
    name: 'azion-ai-chat-root-block'
  })
  const azionAiChatRef = ref(null)
  const azionAiChatMobileRef = ref(null)
  const renderCount = ref(1)
  const router = useRouter()
  const { width } = useWindowSize()
  const currentWidth = ref(width.value)
  const SCREEN_BREAKPOINT_MD = 768

  onMounted(() => {
    window.addEventListener('message', aiCustomPromptListenerHandler)
    addSupportToHljs()
  })

  onUnmounted(() => {
    window.removeEventListener('message', aiCustomPromptListenerHandler)
  })

  const isChatMobile = computed(() => {
    return currentWidth.value > SCREEN_BREAKPOINT_MD
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
    updateChatRenderInstance()
    azionAiChatRef?.value?.clearMessages()
    azionAiChatMobileRef?.value?.clearMessages()
    updateSessionId()
  }

  const aiCustomPromptListenerHandler = (event) => {
    handleClearChat()
    setTimeout(() => {
      if (event.data.type === AZION_MESSAGE_TYPE) {
        azionAiChatStore.open()
        azionAiChatRef?.value?.submitUserMessageGetHelp(event.data.prompt)

        azionAiChatMobileRef?.value?.submitUserMessageGetHelp(event.data.prompt)
      }
    }, 100)
  }

  const openChatInNewTab = () => {
    const url = `${window.location.origin}${router.resolve({ name: 'copilot' }).path}`
    windowOpen(url, '_blank')
  }

  watch(
    width,
    () => {
      currentWidth.value = width.value
    },
    { immediate: true }
  )
</script>
