<template>
  <div class="flex flex-col !w-full surface-border border-l h-[100ldh] z-50">
    <div
      class="h-full flex"
      :key="renderCount"
    >
      <AzionAiChat
        ref="azionAiChatRef"
        :insert-deep-chat-styles="styleViewDeepChat"
      />
    </div>
  </div>
</template>

<script setup>
  import AzionAiChat from './azion-ai-chat-block.vue'
  import { updateSessionId } from './services/make-session-id'
  import { onMounted, ref } from 'vue'

  import hljs from 'highlight.js'

  defineOptions({
    name: 'azion-ai-chat-full-size-block'
  })

  onMounted(() => {
    addSupportToHljs()
  })

  const renderCount = ref(1)
  const azionAiChatRef = ref(null)
  const styleViewDeepChat = {
    height: 'calc(80svh - 113px)',
    top: 'none'
  }
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
    updateSessionId()
    updateChatRenderInstance()
  }

  defineExpose({
    handleClearChat
  })
</script>
