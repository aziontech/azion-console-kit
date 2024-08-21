<script setup>
  defineOptions({ name: 'advanced-filter' })
  import { computed, ref, watch } from 'vue'
  import dialogFilter from './dialog-filter.vue'
  import PrimeButton from 'primevue/button'
  import { OPERATOR_MAPPING } from './component'
  import chipsDefaultDisplay from './component/display/chips-default-display.vue'
  import chipsRangeDisplay from './component/display/chips-range-display.vue'
  import chipsInDisplay from './component/display/chips-in-display.vue'

  const emit = defineEmits(['applyFilter', 'update:filterAdvanced'])

  const props = defineProps({
    fieldsInFilter: {
      type: Array,
      required: true
    },
    disabled: {
      type: Boolean
    },
    filterAdvanced: {
      type: Object
    }
  })

  const FORMAT_IN = 'In'
  const FORMAT_RANGE = 'Range'
  const DEFAULT_FORMAT = [FORMAT_IN, FORMAT_RANGE]
  const displayFilter = ref([])
  const refDialogFilter = ref()

  const disabledSearch = computed(() => {
    return props.disabled
  })

  const listField = computed(() => {
    return props.fieldsInFilter.map((itemField) => {
      const itemDisplay = displayFilter.value.filter((itemFieldDisplay) => {
        return itemField.value === itemFieldDisplay.valueField
      })

      const operator = itemField.operator.map((operator) => {
        const itemOperator = itemDisplay.find((dOperator) => operator.value === dOperator.operator)

        const disabledOperator = operator.disabled || itemOperator?.operator === operator.value
        return { ...operator, disabled: disabledOperator }
      })

      const disabledAllOperator = operator.every((operator) => operator.disabled)
      const disabledField = itemField.disabled || disabledAllOperator

      return {
        ...itemField,
        disabled: disabledField,
        operator
      }
    })
  })

  const clickFilter = (item, event) => {
    event.stopPropagation()
    refDialogFilter.value.show(item)
  }

  const removeItemFilter = (index, event) => {
    refDialogFilter.value.hide(event)
    displayFilter.value.splice(index, 1)
  }

  const removeValueItemFilter = (index, idx, event) => {
    refDialogFilter.value.hide(event)

    displayFilter.value[index].value.splice(idx, 1)
    if (!displayFilter.value[index].value.length) {
      displayFilter.value.splice(index, 1)
    }
  }

  const searchFilter = () => {
    const adaptFilter = adapterApply(displayFilter.value)
    emit('update:filterAdvanced', adaptFilter)
    emit('applyFilter', adaptFilter)
  }

  const updateFilter = (value) => {
    setFilter(value)
  }

  const adapterApply = (displayFilter) => {
    return displayFilter?.map(({ valueField, operator, value, type }) => {
      return { valueField, operator, value, type }
    })
  }

  const setFilter = (value) => {
    if (value.edit) {
      const index = displayFilter.value.findIndex(
        (item) => item.field === value.field && item.operator === value.operator
      )
      displayFilter.value[index] = { ...value }
      return
    }

    displayFilter.value.push({ ...value })
  }

  const updateDisplayFilter = (filterDisplay) => {
    if (!filterDisplay?.length) return

    const newDisplay = filterDisplay.map((item) => {
      const { label, disabled, operator } = props.fieldsInFilter.find(
        ({ value }) => value === item.valueField
      )

      const disabledOp = operator.find(({ value }) => value === item.operator)?.disabled

      if (disabled || disabledOp) return

      return {
        ...item,
        field: label,
        format: OPERATOR_MAPPING[item.operator].format
      }
    })

    displayFilter.value = newDisplay.filter((item) => item)
  }

  const clearDisplayFilter = () => {
    if (!displayFilter.value.length) return
    displayFilter.value = []
    emit('update:filterAdvanced', [])
  }

  watch(
    () => props.fieldsInFilter,
    () => {
      updateDisplayFilter(displayFilter.value)
    }
  )

  watch(
    () => props.filterAdvanced,
    (newValue) => {
      updateDisplayFilter(newValue)
    },
    { immediate: true }
  )

  defineExpose({
    clearDisplayFilter
  })
</script>

<template>
  <div
    class="flex w-full min-w-0 flex-column gap-2 md:flex-row"
    data-testid="search-filter-container"
  >
    <dialogFilter
      :disabled="props.disabled"
      ref="refDialogFilter"
      :filtersOptions="listField"
      :counter="displayFilter.length"
      @applyFilter="updateFilter"
      data-testid="search-filter-dialog"
    />

    <div
      class="md:-ml-2 md:border-b md:border-left-none md:border-r border-solid border-t flex items-center p-inputtext md:rounded-[0px_6px_6px_0px] w-full overflow-x-auto overflow-y-hidden h-[2.313rem]"
      data-testid="search-filter-chips-container"
    >
      <ul
        class="flex gap-3 align-items-center"
        data-testid="search-filter-chips-list"
      >
        <template
          v-for="(itemFilter, index) in displayFilter"
          :key="itemFilter"
        >
          <li
            v-if="!DEFAULT_FORMAT.includes(itemFilter.operator)"
            data-testid="search-filter-chip-item"
          >
            <chipsDefaultDisplay
              :itemFilter="itemFilter"
              :position="index"
              :clickFilter="clickFilter"
              :removeItemFilter="removeItemFilter"
              data-testid="search-filter-chip-default"
            />
          </li>
          <li
            v-if="itemFilter.operator === FORMAT_RANGE"
            data-testid="search-filter-chip-item"
          >
            <chipsRangeDisplay
              :itemFilter="itemFilter"
              :position="index"
              :clickFilter="clickFilter"
              :removeItemFilter="removeItemFilter"
              data-testid="search-filter-chip-range"
            />
          </li>
          <li
            v-if="itemFilter.operator === FORMAT_IN"
            class="flex gap-3 align-items-center"
            data-testid="search-filter-chip-item"
          >
            <chipsInDisplay
              :itemFilter="itemFilter"
              :position="index"
              :clickFilter="clickFilter"
              :removeValueItemFilter="removeValueItemFilter"
              data-testid="search-filter-chip-in"
            />
          </li>
          <li
            v-if="displayFilter.length > index + 1"
            data-testid="search-filter-chip-item"
          >
            and
          </li>
        </template>
      </ul>
    </div>

    <PrimeButton
      class="min-w-max max-sm:bg-red"
      size="small"
      :disabled="disabledSearch"
      @click="searchFilter"
      label="Search"
      data-testid="search-filter-search-button"
    />
  </div>
</template>
