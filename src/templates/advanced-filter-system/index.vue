<template>
  <div
    class="flex flex-col sm:flex-row items-center gap-4 p-6 bg-surface-card border border-surface-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
  >
    <FilterDataRange
      v-model="dateRangeTest"
      @change="handleDateChange"
    />
    <div class="flex flex-col gap-2">
      <div>
        <span>Start Date:</span>
        <span>{{ dateRangeTest.startDate.toLocaleString() }}</span>
      </div>
      <div>
        <span>End Date:</span>
        <span>{{ dateRangeTest.endDate.toLocaleString() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, watch, defineModel } from 'vue'
  import PrimeButton from 'primevue/button'
  import OverlayPanel from 'primevue/overlaypanel'
  import AdvancedCalendar from './components/AdvancedCalendar.vue'
  import AdvancedFilter from './components/AdvancedFilter.vue'
  import AdvancedInput from './components/AdvancedInput.vue'
  import FilterDataRange from '@/components/filterDataRange/index.vue'
  // Model
  const model = defineModel({
    type: Object,
    default: () => ({
      searchQuery: '',
      dateRange: {
        startDate: new Date(),
        endDate: new Date()
      },
      filters: []
    })
  })

  // Emits
  const emit = defineEmits(['search', 'dateChange', 'filterChange', 'update'])

  // Component name
  defineOptions({ name: 'AdvancedFilterSystem' })

  const dateRangeTest = ref({
    startDate: new Date(),
    endDate: new Date()
  })

  // Refs
  const filterPanel = ref(null)
  const searchQuery = ref(model.value.searchQuery || '')
  const dateRange = ref(
    model.value.dateRange || {
      startDate: new Date(),
      endDate: new Date()
    }
  )
  const filters = ref(model.value.filters || [])

  // Computed
  const currentState = computed(() => ({
    searchQuery: searchQuery.value,
    dateRange: dateRange.value,
    filters: filters.value
  }))

  // Methods
  const toggleFilterPanel = (event) => {
    filterPanel.value.toggle(event)
  }

  const addNewFilter = () => {
    // Adiciona um novo filtro vazio
    filters.value.push({
      id: Date.now(),
      field: '',
      operator: '',
      value: '',
      label: ''
    })
  }

  const handleSearch = (query) => {
    searchQuery.value = query
    emit('search', query)
    model.value = currentState.value
  }

  const handleDateChange = (range) => {
    dateRange.value = range
    emit('dateChange', range)
    model.value = currentState.value
  }

  const handleAddFilter = (filter) => {
    filters.value.push(filter)
    emit('filterChange', filters.value)
    model.value = currentState.value
  }

  const handleRemoveFilter = (filterId) => {
    const index = filters.value.findIndex((f) => f.id === filterId)
    if (index > -1) {
      filters.value.splice(index, 1)
      emit('filterChange', filters.value)
      emit('update:modelValue', currentState.value)
    }
  }

  const handleUpdateFilter = (updatedFilter) => {
    const index = filters.value.findIndex((f) => f.id === updatedFilter.id)
    if (index > -1) {
      filters.value[index] = updatedFilter
      emit('filterChange', filters.value)
      emit('update:modelValue', currentState.value)
    }
  }

  const handleUpdate = () => {
    emit('update', currentState.value)
  }

  // Watchers
  watch(
    currentState,
    (newState) => {
      emit('update:modelValue', newState)
    },
    { deep: true }
  )
</script>
