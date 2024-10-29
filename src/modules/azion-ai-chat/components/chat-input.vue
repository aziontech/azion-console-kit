<template>
  <div class="bottom-0 chat-input flex sticky p-6 pt-3 flex flex-col gap-2 text-center">
    <div class="flex w-full">
      <Textarea
        v-model="userMessage"
        autoResize
        rows="1"
        maxlength="16000"
        @keyup.enter="sendMessage"
        :class="[
          'w-full min-h-[2.75rem] max-h-[12.5rem] px-2 pr-0 pl-4 align-content-center border-noround border-round-left custom-scroll border-none shadow-none',
          isOverflowTextArea
        ]"
        @input="checkOverflow"
      />
      <div
        class="flex align-items-end pb-1 border-noround border-round-right p-inputnumber-button pr-3"
      >
        <PrimeButton
          severity="Primary"
          outlined
          icon="pi pi-fw pi-send"
          aria-label="send"
          @click="sendMessage"
        />
      </div>
    </div>
    <div>
      <small class="text-xs text-color-secondary font-normal leading-5 text-center mb-2 mx-2">
        Azion Copilot may make mistakes. Consider verifying important information.
      </small>
    </div>
  </div>
</template>

<script setup>
  import Textarea from 'primevue/textarea'
  import PrimeButton from 'primevue/button'
  import { ref, defineEmits } from 'vue'

  const isOverflowTextArea = ref('')
  const checkOverflow = (event) => {
    const textareaElement = event?.target
    if (!textareaElement) return

    const lineHeight = parseInt(window.getComputedStyle(textareaElement).lineHeight)
    const scrollHeight = textareaElement.scrollHeight

    isOverflowTextArea.value = Math.floor(scrollHeight / lineHeight) > 5 ? 'overflow-auto' : ''
  }

  const userMessage = ref('')
  const emit = defineEmits(['sendMessage'])

  const sendMessage = () => {
    if (userMessage.value.trim()) {
      emit('sendMessage', userMessage.value)
      userMessage.value = ''
    }
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
