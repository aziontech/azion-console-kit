<template>
  <div
    :style="{ 'background-color': 'var(--surface-section)' }"
    class="hidden flex-col w-full surface-border border-l h-[100ldh] transform translate-x-full transition-transform duration-300 ease-in-out sm:w-[500px] 2xl:w-[800px]"
  >
    <azionAiChatDesktop v-if="isChatMobile" />
    <azionAiChatMobile v-else />
  </div>
</template>

<script setup>
  import azionAiChatDesktop from './azion-ai-chat-desktop.vue'
  import azionAiChatMobile from './azion-ai-chat-mobile.vue'
  import { useWindowSize } from '@vueuse/core'
  import { computed, ref, watch } from 'vue'

  defineOptions({
    name: 'azion-ai-chat-root-block'
  })

  const { width } = useWindowSize()
  const currentWidth = ref(width.value)
  const SCREEN_BREAKPOINT_MD = 768

  const isChatMobile = computed(() => {
    return currentWidth.value > SCREEN_BREAKPOINT_MD
  })

  watch(
    width,
    () => {
      currentWidth.value = width.value
    },
    { immediate: true }
  )
</script>
