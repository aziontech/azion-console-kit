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

  const filterTooltip = (filter) => {
    const field = filter.field
    const op = labelOperator(filter)
    let value = ''
    if (filter.operator === 'Range') {
      value = `(${filter.value.begin}, ${filter.value.end})`
    } else if (filter.operator === 'In') {
      value = `(${filter.value.map((item) => item.label).join(', ')})`
    } else {
      value = String(filter.value)
    }
    return `${field} ${op}: ${value}`
  }
</script>

<template>
  <div class="flex gap-2 items-center flex-nowrap flex-1 overflow-hidden">
    <div
      v-for="(filter, index) in processedFilters"
      :key="index"
      class="inline-flex items-center gap-1 py-1.5 px-2.5 rounded-md border text-sm surface-border transition-colors max-w-xs flex-shrink-0"
      v-tooltip.bottom="{ value: filterTooltip(filter), showDelay: 300 }"
      @click="handleClickFilter(filter)"
    >
      <span class="text-color font-normal whitespace-nowrap">{{ filter.field }}</span>
      <span class="text-color font-medium whitespace-nowrap">{{ labelOperator(filter) }}:</span>
      <span
        class="truncate max-w-[12rem]"
        v-if="filter.operator === 'Range'"
      >
        ({{ filter.value.begin }},{{ filter.value.end }})
      </span>
      <span
        class="truncate max-w-[12rem]"
        v-else-if="filter.operator === 'In'"
      >
        ({{ filter.value.map((item) => item.label).join(', ') }})
      </span>
      <span
        class="truncate max-w-[12rem]"
        v-else
        >{{ filter.value }}</span
      >
      <i
        class="pl-1 pi pi-times-circle cursor-pointer text-sm flex-shrink-0"
        @click.stop="removeFilter(index)"
      />
    </div>
  </div>
</template>
