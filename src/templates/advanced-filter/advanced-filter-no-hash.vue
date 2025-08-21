<script setup>
  defineOptions({ name: 'advanced-filter' })
  import { computed, watch, onMounted, defineModel } from 'vue'
  import dialogFilter from './dialog-filter.vue'

  import { OPERATOR_MAPPING } from './component'

  const emit = defineEmits(['applyFilter'])

  const displayFilter = defineModel('displayFilter')
  const filterAdvanced = defineModel('filterAdvanced')

  const props = defineProps({
    fieldsInFilter: {
      type: Array,
      required: true
    }
  })

  onMounted(() => {
    if (props.fieldsInFilter.length) updateDisplayFilter(filterAdvanced.value)
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
    emit('applyFilter', displayFilter)
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
      const selectedFields = props.fieldsInFilter.filter(({ value }) => value === item.valueField)

      if (!selectedFields?.length) return {}
      const { label, disabled, operator } = selectedFields.find(({ operator }) => {
        return operator.find(({ value }) => value === item.operator)
      })

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

  watch(
    () => props.fieldsInFilter,
    () => {
      updateDisplayFilter(filterAdvanced.value)
    }
  )
</script>

<template>
  <dialogFilter
    :filtersOptions="listField"
    @applyFilter="updateFilter"
    data-testid="search-filter-dialog"
  />
</template>
