<!-- src/components/suggestions.vue -->
<template>
  <div class="flex flex-wrap justify-center gap-3">
    <Card
      class="p-4 w-52 cursor-pointer select-none"
      v-for="(suggestion, index) in props.suggestions"
      :key="index"
      @click="selectSuggestion(suggestion)"
    >
      <template #title>
        <span
          class="text-orange-500"
          :class="suggestion.icon"
        />
      </template>
      <template #content>
        <p class="text-xs sm:text-sm text-color-secondary">
          {{ suggestion.context }}
        </p>
      </template>
    </Card>
  </div>
</template>

<script setup>
  import Card from 'primevue/card'
  const props = defineProps({
    suggestions: Array
  })

  const emit = defineEmits(['selectSuggestion'])

  function selectSuggestion(suggestion) {
    emit('selectSuggestion', suggestion.context)
  }
</script>
