<template>
  <div class="flex items-center gap-4 p-6 border rounded-lg shadow-sm">
    <AdvancedFilter
      v-model="model.filters"
      :filtersOptions="props.fieldsFilter"
      @apply-filter="handleApplyFilter"
    />

    <DataTimeRange v-model="model.dateRange" />
    <div class="flex flex-col gap-2 text-xs text-color-secondary">
      <div>
        <span>Active Filters:</span>
        <span class="text-color">{{ model.filters?.length || 0 }}</span>
      </div>
      <div>
        <span>Date Range:</span>
        <span class="text-color">{{ formatDateRange(model.dateRange) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { defineModel, onMounted } from 'vue'

  defineOptions({ name: 'AdvancedFilterSystem' })
  import AdvancedFilter from '@/components/base/filterFields'
  import DataTimeRange from '@/components/base/dataTimeRange'

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
      default: () => [
        {
          label: 'Status',
          value: 'status',
          type: 'String'
        },
        {
          label: 'Domain',
          value: 'domain',
          type: 'String'
        },
        {
          label: 'Response Time',
          value: 'response_time',
          type: 'Float'
        },
        {
          label: 'Request Count',
          value: 'request_count',
          type: 'Int'
        },
        {
          label: 'Country',
          value: 'country',
          type: 'StringObject'
        },
        {
          label: 'IP Address',
          value: 'ip_address',
          type: 'String'
        }
      ]
    }
  })

  onMounted(() => {
    // Ensure model is properly initialized
    if (!model.value) {
      model.value = {
        searchQuery: {},
        dateRange: {},
        filters: []
      }
    }

    if (!model.value.dateRange) {
      model.value.dateRange = {
        startDate: new Date(new Date().setDate(new Date().getDate() - 6)),
        endDate: new Date()
      }
    }

    if (!model.value.filters) {
      model.value.filters = []
    }
  })

  // Methods
  const handleApplyFilter = () => {
    // Handle the applied filter data
    // TODO: Process filter data
  }

  const formatDateRange = (dateRange) => {
    if (!dateRange?.startDate || !dateRange?.endDate) return 'Not set'

    const start = new Date(dateRange.startDate).toLocaleDateString()
    const end = new Date(dateRange.endDate).toLocaleDateString()
    return `${start} - ${end}`
  }
</script>
