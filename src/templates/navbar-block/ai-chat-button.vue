<template>
  <PrimeButton
    @click="openAiChat()"
    size="small"
    class="rounded-md overflow-hidden bg-transparent duration-300 flex justify-center items-center w-auto h-auto relative p-[1px] border-none"
    v-tooltip.bottom="{ value: 'Copilot', showDelay: 200 }"
  >
  <div class="absolute inset-0 animated-border"
    ></div>
    <div class="flex border-custom gap-1.5 transition-all duration-300 items-center text-white md:w-auto w-8 justify-center md:px-3 bg-header h-8 rounded relative z-10"
    :class="{
      'bg-header hover:bg-[#444444]/10': !aiChatIsOpen,
      'bg-[#444444]/60': aiChatIsOpen
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

<style>
  :root {
    --color-violet: 0, 20, 255;
    --color-orange: 255, 120, 0;
    --color-black: 10, 10, 10;
    --color-white: 255, 255, 255;
  }
  
  .border-custom {
    -webkit-box-shadow:inset 0px 0px 0px .5px #3E3E3E;
    -moz-box-shadow:inset 0px 0px 0px .5px #3E3E3E;
    box-shadow:inset 0px 0px 0px .5px #3E3E3E;
  }

  .animated-border {
      filter: blur(12px);
      background: linear-gradient(
        90deg,
        rgba(var(--color-white), 1),
        rgba(var(--color-violet), 1),
        rgba(var(--color-orange), 1)
      );
      animation: rotate-background 8s linear infinite;
    }

    @keyframes rotate-background {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
</style>
