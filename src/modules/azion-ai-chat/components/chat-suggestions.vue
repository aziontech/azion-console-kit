<template>
  <div class="flex flex-wrap justify-center gap-3">
    <Card
      class="p-4 w-52 cursor-pointer select-none border surface-border hover:border-primary shadow-none"
      v-for="(suggestion, index) in suggestions"
      :key="index"
      @click="selectSuggestion(suggestion)"
    >
      <template #title>
        <span
          class="text-orange-500"
          :class="suggestion.icon || 'pi pi-question-circle'"
        />
      </template>
      <template #content>
        <p class="text-xs sm:text-sm text-color-secondary">
          {{ suggestion.title }}
        </p>
      </template>
    </Card>
  </div>
</template>

<script setup>
  import Card from 'primevue/card'
  import { useChat } from '../composables/use-chat'

  const { suggestions, sendMessage } = useChat()

  function selectSuggestion(suggestion) {
    sendMessage(suggestion.context)
  }
</script>
