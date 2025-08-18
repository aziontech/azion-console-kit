<template>
  <div class="flex items-center gap-4 p-6 border rounded-lg shadow-sm">
    <AdvancedFilter
      v-model="model.filters"
      :fields="props.fieldsFilter"
    />

    <FilterDataRange v-model="model.dateRange" />
    <div class="flex flex-col gap-2 text-xs text-color-secondary">
      <div>
        <span>Start Date:</span>
        <span class="text-color">{{ model.filters }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { defineModel, onMounted } from 'vue'
  import AdvancedFilter from './components/AdvancedFilter.vue'
  import FilterDataRange from '@/components/filterDataRange/index.vue'

  // Model
  const model = defineModel({
    type: Object,
    default: () => ({
      searchQuery: {},
      dateRange: {},
      filters: []
    })
  })

  const props = defineProps({
    fieldsFilter: {
      type: Array,
      default: () => []
    }
  })

  onMounted(() => {
    if (!model.value.dateRange) {
      model.value.dateRange = {
        startDate: new Date(new Date().setDate(new Date().getDate() - 6)),
        endDate: new Date()
      }
    }
  })

  // Methods
</script>
