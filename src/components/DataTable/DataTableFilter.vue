<script setup>
  import { ref, computed, watch } from 'vue'
  import PrimeButton from 'primevue/button'
  import FilterRow from './FilterRow.vue'

  const props = defineProps({
    filters: {
      type: Array,
      default: () => []
    },
    appliedFilters: {
      type: Array,
      default: () => []
    },
    visible: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['apply', 'remove', 'clear', 'update:visible', 'update'])

  const isAddingFilter = ref(false)
  const filterStates = ref([])
  const hasChanges = ref(false)

  watch(
    () => props.visible,
    (newValue) => {
      if (newValue) {
        initializeFilterStates()
        if (props.appliedFilters.length === 0 && !isAddingFilter.value) {
          handleStartAddFilter()
        }
      }
    }
  )

  watch(
    () => props.appliedFilters,
    () => {
      if (props.visible) {
        initializeFilterStates()
      }
    },
    { deep: true }
  )

  const initializeFilterStates = () => {
    filterStates.value = props.appliedFilters.map((filter) => ({
      field: filter.field,
      value: filter.value,
      label: filter.label,
      isValid: true
    }))
    hasChanges.value = false
  }

  const getFilterOptions = (excludeIndex = null) => {
    const appliedFields = props.appliedFilters
      .map((filter) => filter.field)
      // eslint-disable-next-line no-unused-vars
      .filter((field, index) => index !== excludeIndex)

    return props.filters.map((col) => {
      const value = col.filterPath.split('.')[0] || col.field?.toLowerCase()
      return {
        label: col.header,
        value,
        multiValue: col.multiValue || false,
        disabled: appliedFields.includes(value)
      }
    })
  }

  const filterOptions = computed(() => getFilterOptions())

  const allFilters = computed(() => {
    const filters = filterStates.value.map((state, index) => ({
      field: state.field,
      value: state.value,
      label: state.label,
      isApplied: index < props.appliedFilters.length
    }))
    return filters
  })

  const canApply = computed(() => {
    return hasChanges.value || isAddingFilter.value
  })

  const handleStartAddFilter = () => {
    const firstAvailableOption = filterOptions.value.find((opt) => !opt.disabled)
    if (firstAvailableOption) {
      filterStates.value.push({
        field: firstAvailableOption.value,
        value: '',
        label: firstAvailableOption.label,
        isValid: true
      })
      isAddingFilter.value = true
      hasChanges.value = true
    }
  }

  const handleFilterChange = ({ index, field, label, value, isValid }) => {
    if (filterStates.value[index]) {
      filterStates.value[index] = { field, label, value, isValid }
      hasChanges.value = true
    }
  }

  const handleApplyFilters = () => {
    if (!canApply.value) return

    filterStates.value.forEach((state, index) => {
      if (index >= props.appliedFilters.length) {
        emit('apply', {
          field: state.field,
          label: state.label,
          value: state.value,
          operator: 'equals'
        })
      } else {
        const original = props.appliedFilters[index]
        if (original.field !== state.field || original.value !== state.value) {
          emit('update', {
            index,
            field: state.field,
            label: state.label,
            value: state.value,
            operator: 'equals'
          })
        }
      }
    })

    isAddingFilter.value = false
    hasChanges.value = false
  }

  const handleRemoveFilter = (index) => {
    if (index >= props.appliedFilters.length) {
      filterStates.value.splice(index, 1)
      isAddingFilter.value = false
      hasChanges.value = filterStates.value.length !== props.appliedFilters.length
      if (props.appliedFilters.length === 0 && filterStates.value.length === 0) {
        emit('clear')
      }
    } else {
      if (props.appliedFilters.length === 1) {
        handleClearFilters()
      } else {
        emit('remove', index)
      }
    }
  }

  const handleClearFilters = () => {
    emit('clear')
    isAddingFilter.value = false
    filterStates.value = []
    hasChanges.value = false
  }

  defineExpose({ handleStartAddFilter })
</script>
<template>
  <div class="flex flex-col h-full gap-3 items-start">
    <div class="flex flex-col gap-2">
      <FilterRow
        v-for="(filter, index) in allFilters"
        :key="`filter-${filter.field}-${index}`"
        :filter="filter"
        :index="index"
        :filterOptions="getFilterOptions(index)"
        @change="handleFilterChange"
        @remove="handleRemoveFilter"
      />
    </div>
  </div>

  <div class="flex items-start gap-2">
    <div class="h-full w-px bg-[#404040]"></div>

    <PrimeButton
      v-if="canApply"
      label="Apply"
      size="small"
      severity="secondary"
      @click="handleApplyFilters"
    />

    <PrimeButton
      v-if="!isAddingFilter"
      outlined
      size="small"
      @click="handleStartAddFilter"
    >
      <i class="pi pi-plus mr-2"></i>
      FILTER
    </PrimeButton>

    <PrimeButton
      text
      size="small"
      @click="handleClearFilters"
    >
      CLEAR
    </PrimeButton>
  </div>
</template>
