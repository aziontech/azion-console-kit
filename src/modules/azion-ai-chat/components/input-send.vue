<template>
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
        v-model="prompt"
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
</template>

<script setup>
  import Textarea from 'primevue/textarea'
  import PrimeButton from 'primevue/button'
  import { ref } from 'vue'

  const isOverflowTextArea = ref('')
  const prompt = ref('')

  const checkOverflow = (event) => {
    const textareaElement = event?.target
    if (!textareaElement) return

    const lineHeight = parseInt(window.getComputedStyle(textareaElement).lineHeight)
    const scrollHeight = textareaElement.scrollHeight

    isOverflowTextArea.value = Math.floor(scrollHeight / lineHeight) > 5 ? 'overflow-auto' : ''
  }

  const sendMessage = () => {
    // Implement the logic to send the message
  }
</script>
