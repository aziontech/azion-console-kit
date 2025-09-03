<template>
  <div class="p-inputgroup w-fit">
    <QuickSelect
      v-model="model"
      :maxDays="maxDays"
      @select="emit('select', $event)"
    />
    <InputDateRange
      v-model="model"
      :maxDays="maxDays"
      @select="emit('select', $event)"
    />
  </div>
</template>

<script setup>
  import QuickSelect from './quickSelect/index.vue'
  import InputDateRange from './inputDateRange/index.vue'
  import { defineModel } from 'vue'

  defineOptions({ name: 'DataTimeRange', inheritAttrs: true })

  const props = defineProps({
    maxDays: {
      type: Number
    }
  })

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
