<script setup>
  defineOptions({ name: 'filterTagsDisplay' })
  import { computed } from 'vue'
  import { OPERATOR_MAPPING_ADVANCED_FILTER } from '@/components/base/advanced-filter-system-v2/filterFields/filterRow/component'
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

  const filterAriaLabel = (filter) => {
    return `Remove filter ${filterTooltip(filter)}`
  }

  const onChipFocus = (event) => {
    event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }
</script>

<template>
  <div
    class="filter-tags-list flex gap-2 items-center flex-nowrap flex-1 overflow-hidden"
    data-testid="rte-chips-scroll-container"
  >
    <div
      v-for="(filter, index) in processedFilters"
      :key="index"
      class="filter-tag inline-flex items-center gap-1 py-1.5 px-2.5 rounded-md border text-sm surface-border transition-colors max-w-xs flex-shrink-0"
      v-tooltip.bottom="{ value: filterTooltip(filter), showDelay: 300 }"
      tabindex="0"
      @click="handleClickFilter(filter)"
      @focus="onChipFocus"
    >
      <span class="text-color font-normal whitespace-nowrap">{{ filter.field }}</span>
      <span class="text-color font-medium whitespace-nowrap">{{ labelOperator(filter) }}:</span>
      <span
        class="filter-tag__value truncate max-w-[12rem]"
        v-if="filter.operator === 'Range'"
      >
        ({{ filter.value.begin }},{{ filter.value.end }})
      </span>
      <span
        class="filter-tag__value truncate max-w-[12rem]"
        v-else-if="filter.operator === 'In'"
      >
        ({{ filter.value.map((item) => item.label).join(', ') }})
      </span>
      <span
        class="filter-tag__value truncate max-w-[12rem]"
        v-else
        >{{ filter.value }}</span
      >
      <button
        type="button"
        class="filter-tag__remove pl-1 cursor-pointer text-sm flex-shrink-0"
        :aria-label="filterAriaLabel(filter)"
        data-testid="rte-chip-remove-button"
        @click.stop="removeFilter(index)"
        @focus.stop="onChipFocus"
      >
        <i
          class="pi pi-times-circle"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
  .filter-tag__remove {
    min-width: 1.5rem;
    min-height: 1.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    padding: 0 0 0 0.25rem;
    color: inherit;
  }

  @media (max-width: 1023px) {
    .filter-tags-list {
      overflow-x: auto;
      overflow-y: hidden;
      flex-wrap: nowrap;
      overscroll-behavior-x: contain;
    }

    .filter-tag__remove {
      min-width: 2.75rem;
      min-height: 2.75rem;
    }
  }

  @media (max-width: 639px) {
    .filter-tag__value {
      max-width: 9rem;
    }
  }

  @media (min-width: 640px) and (max-width: 1023px) {
    .filter-tag__value {
      max-width: 14rem;
    }
  }
</style>
