<script setup>
import Card from 'primevue/card'
import IntervalFilter from './components/IntervalFilter'
import ContentFilter from './components/ContentFilter'
import { onMounted } from 'vue'

// const props = defineProps({})

onMounted(() => { })
</script>

<template>
  <Card class="p-3.5 mb-8">
    <template #content>
      <div class="pb-4">
        <IntervalFilter />
      </div>

      <ContentFilter />
    </template>
  </Card>
</template>
