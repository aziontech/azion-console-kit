<!-- src/components/suggestions.vue -->
<template>
    <div class="suggestions">
        <button v-for="(suggestion, index) in suggestions" :key="index" @click="selectSuggestion(suggestion)">
            {{ suggestion.title }}
        </button>
    </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
    suggestions: Array,
});

const emit = defineEmits(['selectSuggestion']);
function selectSuggestion(suggestion) {
    emit('selectSuggestion', suggestion.content);
}
</script>