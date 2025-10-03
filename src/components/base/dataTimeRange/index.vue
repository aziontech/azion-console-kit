<template>
  <div class="p-inputgroup w-fit">
    <QuickSelect
      v-model="dateRange"
      :maxDays="maxDays"
      @select="updateDateRange"
    />

    <InputDateRange
      v-model="dateRange"
      :maxDays="maxDays"
      @select="updateDateRange"
    />
  </div>
</template>

<script setup>
  import QuickSelect from './quickSelect/index.vue'
  import InputDateRange from './inputDateRange/index.vue'
  import { defineModel } from 'vue'

  defineOptions({ name: 'DataTimeRange', inheritAttrs: true })

  defineProps({
    maxDays: {
      type: Number,
      default: 0
    }
  })

  const dateRange = defineModel({
    type: Object,
    default: () => ({
      startDate: new Date(),
      endDate: new Date(),
      label: ''
    })
  })

  const isPendingChange = defineModel('isPendingChange', {
    type: Boolean,
    default: false
  })

  const updateDateRange = (data) => {
    isPendingChange.value = false
    console.log('updateDateRange', data)
  }
</script>
