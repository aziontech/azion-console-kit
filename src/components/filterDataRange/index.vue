<template>
  <div class="flex">
    <QuickSelect v-model="model" />
    <InputDateRange v-model="model" />
  </div>
</template>

<script setup>
  import QuickSelect from './quickSelect.vue'
  import InputDateRange from './inputDateRange.vue'
  import { defineModel } from 'vue'

  const model = defineModel({
    type: Object,
    default: () => ({
      startDate: new Date(new Date().setDate(new Date().getDate() - 6)),
      endDate: new Date(),
      label: 'Last 7 days'
    })
  })

  defineOptions({ name: 'FilterDataRange' })
</script>
