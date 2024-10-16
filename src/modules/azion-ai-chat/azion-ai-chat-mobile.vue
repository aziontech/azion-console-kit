<template>
  <Sidebar
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
      <AzionAiChat />
    </div>
  </Sidebar>
</template>

<script setup>
  import Sidebar from 'primevue/sidebar'
  import PrimeTag from 'primevue/tag'
  import PrimeButton from 'primevue/button'
  import AzionAiChat from './azion-ai-chat-block.vue'
  import { computed } from 'vue'
  import { useAzionAiChatStore } from '@/stores/azion-ai-chat-store'
  const azionAiChatStore = useAzionAiChatStore()

  const isChatAiOpen = computed(() => azionAiChatStore.isOpen)
</script>
