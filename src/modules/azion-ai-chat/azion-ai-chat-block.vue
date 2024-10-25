<template>
  <div class="flex flex-col w-full h-full px-6 pt-5">
    <div class="flex-auto overflow-y-auto">
      <div v-if="messages"></div>
      <div v-else></div>
    </div>
    <div class="flex flex-col gap-4 mt-1.5 mb-6">
      <div class="flex gap-3 items-end">
        <PrimeButton
          icon="pi pi-fw pi-check-square"
          severity="Primary"
          class="min-h-[2.75rem] min-w-[2.75rem] p-2"
          aria-label="Close"
          @click="azionAiChatStore.close()"
        />
        <div class="flex items-end flex-auto h-full">
          <Textarea
            v-model="value"
            autoResize
            rows="1"
            maxlength="16000"
            :class="[
              'w-full min-h-[2.75rem] max-h-[12.5rem] px-2 pr-0 pl-4 align-content-center border-noround border-round-left custom-scroll',
              isOverflowTextArea
            ]"
            @input="checkOverflow"
          />
          <div
            class="h-full flex align-items-end pb-1 border-noround border-round-right p-inputnumber-button pr-3"
          >
            <PrimeButton
              severity="Primary"
              outlined
              icon="pi pi-fw pi-send"
              aria-label="send"
            />
          </div>
        </div>
      </div>
      <small class="text-xs text-color-secondary font-normal leading-5 text-center mb-2 mx-2">
        Azion Copilot may make mistakes. Consider verifying important information.
      </small>
    </div>
  </div>
</template>

<script setup>
  import Textarea from 'primevue/textarea'
  import PrimeButton from 'primevue/button'
  import { ref } from 'vue'

  defineOptions({
    name: 'azion-ai-chat-block'
  })

  const value = ref('')

  const isOverflowTextArea = ref('')

  const checkOverflow = (event) => {
    const textareaElement = event?.target
    if (!textareaElement) return

    const lineHeight = parseInt(window.getComputedStyle(textareaElement).lineHeight)
    const scrollHeight = textareaElement.scrollHeight

    isOverflowTextArea.value = Math.floor(scrollHeight / lineHeight) > 5 ? 'overflow-auto' : ''
  }
</script>

<style scoped>
  .custom-scroll::-webkit-scrollbar {
    width: 8px;
  }

  .custom-scroll::-webkit-scrollbar-thumb {
    background-color: var(--surface-section);
    border-radius: 4px;
  }
</style>
