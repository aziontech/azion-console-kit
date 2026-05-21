<script setup>
  defineOptions({ name: 'filterTagsDisplay' })
  import { computed } from 'vue'
  import { OPERATOR_MAPPING_ADVANCED_FILTER } from '@/components/base/advanced-filter-system/filterFields/filterRow/component'
  const emit = defineEmits(['removeFilter', 'clickFilter'])

  const props = defineProps({
    filters: {
      type: Array,
      default: () => []
    },
    fieldsInFilter: {
      type: Array,
      default: () => []
    }
  })

  const processedFilters = computed(() => {
    if (!props.filters?.length) return []

    return props.filters
      .map((item) => {
        const selectedFields = props.fieldsInFilter.filter(({ value }) => value === item.valueField)

        if (!selectedFields?.length) return null

        const selectedField = selectedFields.find(({ operator }) => {
          return operator.find(({ value }) => value === item.operator)
        })

        if (!selectedField) return null

        const { label, disabled, operator } = selectedField
        const disabledOp = operator.find(({ value }) => value === item.operator)?.disabled

        if (disabled || disabledOp) return null

        return {
          ...item,
          field: label
        }
      })
      .filter(Boolean)
  })

  const removeFilter = (index) => {
    emit('removeFilter', index)
  }

  const handleClickFilter = (filter) => {
    emit('clickFilter', filter)
  }

  const labelOperator = ({ operator }) => {
    return OPERATOR_MAPPING_ADVANCED_FILTER[operator]?.label.toLowerCase()
  }
</script>

<template>
  <div class="flex gap-2 items-center flex-wrap flex-1">
    <div
      v-for="(filter, index) in processedFilters"
      :key="index"
      class="inline-flex items-center gap-1 py-1.5 px-2.5 rounded-md border text-sm surface-border transition-colors"
      @click="handleClickFilter(filter)"
    >
      <span class="text-color font-normal">{{ filter.field }}</span>
      <span class="text-color font-medium">{{ labelOperator(filter) }}:</span>
      <span v-if="filter.operator === 'Range'">
        ({{ filter.value.begin }},{{ filter.value.end }})
      </span>
      <span v-else-if="filter.operator === 'In'">
        ({{ filter.value.map((item) => item.label).join(', ') }})
      </span>
      <span v-else>{{ filter.value }}</span>
      <i
        class="pl-1 pi pi-times-circle cursor-pointer text-sm"
        @click="removeFilter(index)"
      />
    </div>
  </div>
</template>
