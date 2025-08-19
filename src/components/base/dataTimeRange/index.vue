<template>
  <div class="flex gap-1 bg-[var(--surface-100)] rounded-lg p-1">
    <QuickSelect v-model="model" />
    <InputDateRange v-model="model" />
  </div>
</template>

<script setup>
  import QuickSelect from './quickSelect/index.vue'
  import InputDateRange from './inputDateRange/index.vue'
  import { defineModel } from 'vue'

  defineOptions({ name: 'DataTimeRange' })

  const model = defineModel({
    type: Object,
    required: false,
    default: () => ({
      start: new Date(),
      end: new Date()
    })
  })
</script>
