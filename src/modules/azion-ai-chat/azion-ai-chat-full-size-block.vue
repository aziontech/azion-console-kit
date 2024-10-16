<template>
  <div class="flex flex-col !w-full surface-border border-l h-[100ldh] z-50">
    <div class="h-full flex">
      <AzionAiChat :insert-deep-chat-styles="styleViewDeepChat" />
    </div>
  </div>
</template>

<script setup>
  import AzionAiChat from './azion-ai-chat-block.vue'

  defineOptions({
    name: 'azion-ai-chat-full-size-block'
  })

  const styleViewDeepChat = {
    height: 'calc(80svh - 113px)',
    top: 'none'
  }
</script>
