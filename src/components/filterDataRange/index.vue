<template>
  <div class="flex gap-1 bg-[var(--surface-100)] rounded-lg p-1">
    <QuickSelect v-model="model" />
    <InputDateRange v-model="model" />
  </div>
</template>

<script setup>
  import QuickSelect from './quickSelect.vue'
  import InputDateRange from './inputDateRange.vue'
  import { defineModel } from 'vue'

  defineOptions({ name: 'FilterDataRange' })

  const model = defineModel({
    type: Object
  })
</script>
