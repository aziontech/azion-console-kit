<template>
  <div
    :style="{ 'background-color': 'var(--surface-section)' }"
    class="hidden flex-col w-full surface-border border-l h-[100ldh] transform translate-x-full transition-transform duration-300 ease-in-out sm:w-[500px] 2xl:w-[800px]"
  >
    <azionAiChatDesktop />
  </div>
</template>

<script setup>
  import azionAiChatDesktop from './azion-ai-chat-desktop.vue'
  import azionAiChatMobile from './azion-ai-chat-mobile.vue'
  import { useAzionAiChatStore } from '@/stores/azion-ai-chat-store'
  import { updateSessionId } from './services/make-session-id'
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import hljs from 'highlight.js'
  import { AZION_MESSAGE_TYPE } from '@modules/azion-ai-chat/directives/custom-ai-prompt'
  import { useRouter } from 'vue-router'
  import { windowOpen } from '@/helpers'

  defineOptions({
    name: 'azion-ai-chat-root-block'
  })
  const azionAiChatRef = ref(null)
  const azionAiChatMobileRef = ref(null)
  const renderCount = ref(1)
  const router = useRouter()

  onMounted(() => {
    window.addEventListener('message', aiCustomPromptListenerHandler)
    addSupportToHljs()
  })

  onUnmounted(() => {
    window.removeEventListener('message', aiCustomPromptListenerHandler)
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
</script>
