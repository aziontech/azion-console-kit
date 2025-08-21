<template>
  <div class="flex gap-1 bg-[var(--surface-100)] rounded-lg p-1">
    <QuickSelect
      v-model="model"
      @select="emit('select', $event)"
    />
    <InputDateRange
      v-model="model"
      @select="emit('select', $event)"
    />
  </div>
</template>

<script setup>
  import QuickSelect from './quickSelect/index.vue'
  import InputDateRange from './inputDateRange/index.vue'
  import { defineModel } from 'vue'

  defineOptions({ name: 'DataTimeRange' })

  const emit = defineEmits(['select'])

  const model = defineModel({
    type: Object,
    required: false,
    default: () => ({
      start: new Date(),
      end: new Date()
    })
  })
</script>
