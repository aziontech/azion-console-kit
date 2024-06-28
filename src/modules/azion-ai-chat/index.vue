<template>
  <div
    :style="{ 'background-color': 'var(--surface-section)' }"
    class="hidden flex-col w-full surface-border border-l h-[100ldh] transform translate-x-full transition-transform duration-300 ease-in-out sm:w-[500px] 2xl:w-[800px]"
  >
    <AzionAiChatHeader>
      <template #header-actions>
        <div class="flex gap-4">
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
            v-tooltip.bottom="'New Chat'"
            @click="azionAiChatStore.close()"
          /></div
      ></template>
    </AzionAiChatHeader>

    <div class="h-full flex justify-between flex-col">
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
          <h2>Azion AI</h2>
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
        <AzionAiChat ref="azionAiChatMobileRef" />
      </div>
    </Sidebar>
  </div>
</template>

<script setup>
  import Sidebar from 'primevue/sidebar'
  import PrimeButton from 'primevue/button'
  import AzionAiChatHeader from './azion-ai-chat-header-block.vue'
  import AzionAiChat from './azion-ai-chat-block.vue'

  import { useAzionAiChatStore } from '@/stores/azion-ai-chat-store'
  import { computed, onMounted, ref } from 'vue'
  import hljs from 'highlight.js'

  defineOptions({
    name: 'azion-ai-chat-root-block'
  })
  const azionAiChatRef = ref(null)
  const azionAiChatMobileRef = ref(null)

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

  const handleClearChat = () => {
    azionAiChatRef?.value.deepChatRef.clearMessages()
    azionAiChatMobileRef?.value.deepChatRef.clearMessages()

    azionAiChatRef?.value.deepChatRef._addMessage({
      html: `
          <style> @import url('src/assets/main.css')</style>
          <style>
            #chat-view #messages{
              overscroll-behavior:none
            }

            #messages  a{
              color: var(--text-color-link) !important;
              text-decoration: underline;
              font-weight: 500;
            }

            .deep-chat-suggestion-button:hover {
              border-color:var(--text-color) !important;
            }
          </style>
      `,
      role: 'notification'
    })
    azionAiChatMobileRef?.value.deepChatRef._addMessage({
      html: `
          <style> @import url('src/assets/main.css')</style>
          <style>
            #chat-view #messages{
              overscroll-behavior:none
            }

            #messages  a{
              color: var(--text-color-link) !important;
              text-decoration: underline;
              font-weight: 500;
            }

            .deep-chat-suggestion-button:hover {
              border-color:var(--text-color) !important;
            }
          </style>
      `,
      role: 'notification'
    })
  }
</script>
