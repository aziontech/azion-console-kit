<script setup>
  defineOptions({ name: 'advanced-filter' })
  import { computed, defineModel } from 'vue'
  import dialogFilter from './dialog-filter.vue'

  import { OPERATOR_MAPPING } from '../filterRow/component'

  const emit = defineEmits(['applyFilter'])

  const filterAdvanced = defineModel('filterAdvanced')

  const props = defineProps({
    fieldsInFilter: {
      type: Array,
      required: true
    }
  })

  const displayFilter = computed(() => {
    if (!filterAdvanced.value?.length) return []

    return filterAdvanced.value
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
          field: label,
          format: OPERATOR_MAPPING[item.operator]?.format
        }
      })
      .filter(Boolean)
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

  const updateFilter = (value) => {
    setFilter(value)
    emit('applyFilter', filterAdvanced.value)
  }

  const setFilter = (value) => {
    if (value.edit) {
      const index = filterAdvanced.value.findIndex(
        (item) => item.valueField === value.valueField && item.operator === value.operator
      )
      if (index !== -1) {
        filterAdvanced.value[index] = {
          valueField: value.valueField,
          operator: value.operator,
          value: value.value,
          type: value.type
        }
      }
      return
    }

    filterAdvanced.value.push({
      valueField: value.valueField,
      operator: value.operator,
      value: value.value,
      type: value.type
    })
  }
</script>

<template>
  <dialogFilter
    :filtersOptions="listField"
    @applyFilter="updateFilter"
    data-testid="search-filter-dialog"
  />
</template>
