<script setup>
  import { formatFilterValue } from './filters/filter-value-formatter'

  defineProps({
    appliedFilters: {
      type: Array,
      default: () => []
    }
  })

  const emit = defineEmits(['remove'])

  const removeFilter = (field) => {
    emit('remove', field)
  }

  const getFormattedValue = (filter) => {
    return formatFilterValue(filter.field, filter.value)
  }
</script>

<template>
  <div
    v-if="appliedFilters.length > 0"
    class="flex flex-wrap gap-2"
  >
    <div
      v-for="filter in appliedFilters"
      :key="filter.field"
      class="flex items-center gap-2 px-3 py-1.5 bg-[var(--input-bg)] rounded-md text-sm"
    >
      <span class="font-normal">{{ filter.label }} {{ filter.matchMode }}:</span>
      <span>{{ getFormattedValue(filter) }}</span>
      <button
        class="flex items-center"
        @click="removeFilter(filter.field)"
        :aria-label="`Remove ${filter.label} filter`"
      >
        <i class="pi pi-times-circle" />
      </button>
    </div>
  </div>
</template>
