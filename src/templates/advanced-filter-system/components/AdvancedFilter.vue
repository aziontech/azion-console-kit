<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-color">Add filter</h3>
      <div class="flex items-center gap-3">
        <button
          class="text-primary hover:text-primary-600 text-sm font-medium transition-colors duration-200 px-3 py-1 rounded-md hover:bg-primary/5"
          @click="toggleQueryDSL"
        >
          Edit as Query DSL
        </button>
        <button
          class="text-color-secondary hover:text-color p-2 rounded-md hover:bg-surface-hover transition-colors duration-200"
        >
          <i class="pi pi-ellipsis-v"></i>
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="space-y-4">
      <div
        v-for="(filter, index) in localFilters"
        :key="filter.id"
        class="flex flex-col lg:flex-row items-start lg:items-center gap-3 p-4 bg-surface-100 border border-surface-border rounded-lg hover:bg-surface-hover hover:shadow-sm transition-all duration-200"
      >
        <!-- Operador lógico -->
        <div
          v-if="index > 0"
          class="flex items-center gap-2 w-full lg:w-auto"
        >
          <Dropdown
            v-model="filter.logicalOperator"
            :options="[
              { label: 'AND', value: 'AND' },
              { label: 'OR', value: 'OR' }
            ]"
            optionLabel="label"
            optionValue="value"
            class="w-20"
            @change="updateFilter(filter)"
          />
        </div>

        <!-- Campo -->
        <Dropdown
          v-model="filter.field"
          :options="availableFields"
          optionLabel="label"
          optionValue="value"
          placeholder="Select a field"
          class="w-full lg:min-w-[180px]"
          @change="onFieldChange(filter)"
        />

        <!-- Operador -->
        <Dropdown
          v-model="filter.operator"
          :options="getOperatorsForField(filter.field)"
          optionLabel="label"
          optionValue="value"
          placeholder="Select operator"
          class="w-full lg:min-w-[140px]"
          :disabled="!filter.field"
          @change="updateFilter(filter)"
        />

        <!-- Valor -->
        <InputText
          v-model="filter.value"
          :placeholder="getPlaceholderForField(filter.field)"
          class="w-full lg:flex-1"
          :disabled="!filter.field"
          @input="updateFilter(filter)"
        />

        <!-- Ações -->
        <div class="flex items-center gap-2 w-full lg:w-auto justify-end lg:justify-start">
          <button
            class="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all duration-200 hover:scale-110"
            @click="removeFilter(filter.id)"
          >
            <i class="pi pi-trash text-sm"></i>
          </button>
          <button
            class="w-8 h-8 flex items-center justify-center text-primary hover:text-primary-600 p-2 rounded-full hover:bg-primary/5 transition-all duration-200 hover:scale-110"
            @click="addFilterAfter(filter.id)"
          >
            <i class="pi pi-plus text-sm"></i>
          </button>
        </div>
      </div>

      <!-- Botão para adicionar novo filtro -->
      <div class="flex items-center gap-2">
        <button
          class="text-primary hover:text-primary-600 text-sm font-medium transition-colors duration-200 flex items-center gap-2 px-4 py-2 rounded-md hover:bg-primary/5 border border-dashed border-primary/30 hover:border-primary/60"
          @click="addNewFilter"
        >
          <i class="pi pi-plus text-xs"></i>
          Add filter
        </button>
      </div>
    </div>

    <!-- Preview -->
    <div class="mt-6 p-4 surface-100 border border-surface-border rounded-lg">
      <div class="flex items-center gap-2 mb-3">
        <i class="pi pi-search text-color-secondary text-sm"></i>
        <span class="text-sm font-medium text-color">Preview</span>
      </div>
      <div
        class="filter-preview text-sm text-color-secondary font-mono bg-surface-card p-3 rounded-md border border-surface-border"
      >
        {{ generatePreview() }}
      </div>
    </div>

    <!-- Custom Label -->
    <div class="mt-6">
      <label class="block text-sm font-medium text-color mb-3">Custom label (optional)</label>
      <InputText
        v-model="customLabel"
        placeholder="Add a custom label here"
        class="w-full"
        @input="updateCustomLabel"
      />
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-surface-border">
      <button
        class="px-6 py-2 text-color-secondary hover:text-color font-medium transition-colors duration-200 rounded-md hover:bg-surface-hover"
        @click="cancel"
      >
        Cancel
      </button>
      <button
        class="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
        @click="addFilter"
      >
        Add filter
      </button>
    </div>
  </div>
</template>

<script setup>
  import { ref, watch } from 'vue'
  import Dropdown from 'primevue/dropdown'
  import InputText from 'primevue/inputtext'

  // Model
  const model = defineModel({
    type: Array,
    default: () => []
  })

  // Emits
  const emit = defineEmits(['add-filter', 'remove-filter', 'update-filter'])

  // Component name
  defineOptions({ name: 'AdvancedFilter' })

  // Refs
  const localFilters = ref([...model.value])
  const customLabel = ref('')
  const showQueryDSL = ref(false)

  // Campos disponíveis (exemplo)
  const availableFields = [
    { label: 'Alert Name', value: 'alert.name' },
    { label: 'Alert Status', value: 'alert.status' },
    { label: 'Alert Severity', value: 'alert.severity' },
    { label: 'Alert Type', value: 'alert.type' },
    { label: 'Host Name', value: 'host.name' },
    { label: 'Service Name', value: 'service.name' },
    { label: 'Message', value: 'message' },
    { label: 'Source', value: 'source' },
    { label: 'Tags', value: 'tags' },
    { label: 'Environment', value: 'environment' }
  ]

  // Operadores por tipo de campo
  const operatorsByType = {
    text: [
      { label: 'is', value: 'is' },
      { label: 'is not', value: 'is not' },
      { label: 'contains', value: 'contains' },
      { label: 'does not contain', value: 'does not contain' },
      { label: 'starts with', value: 'starts with' },
      { label: 'ends with', value: 'ends with' }
    ],
    number: [
      { label: 'is', value: 'is' },
      { label: 'is not', value: 'is not' },
      { label: 'is greater than', value: 'is greater than' },
      { label: 'is less than', value: 'is less than' },
      { label: 'is greater than or equal to', value: 'is greater than or equal to' },
      { label: 'is less than or equal to', value: 'is less than or equal to' }
    ],
    boolean: [
      { label: 'is', value: 'is' },
      { label: 'is not', value: 'is not' }
    ]
  }

  // Methods
  const getOperatorsForField = (field) => {
    // Determina o tipo do campo baseado no nome
    if (field.includes('severity') || field.includes('status')) {
      return operatorsByType.text
    } else if (field.includes('threshold') || field.includes('value')) {
      return operatorsByType.number
    } else {
      return operatorsByType.text
    }
  }

  const getPlaceholderForField = (field) => {
    if (!field) return 'Please select a field first...'

    if (field.includes('severity')) {
      return 'e.g. high, medium, low'
    } else if (field.includes('status')) {
      return 'e.g. active, resolved, acknowledged'
    } else if (field.includes('threshold')) {
      return 'e.g. 75'
    } else {
      return 'Enter value...'
    }
  }

  const onFieldChange = (filter) => {
    // Reset operator when field changes
    filter.operator = ''
    filter.value = ''
    updateFilter(filter)
  }

  const updateFilter = (filter) => {
    const index = localFilters.value.findIndex((filterItem) => filterItem.id === filter.id)
    if (index > -1) {
      localFilters.value[index] = { ...filter }
      emit('update-filter', filter)
      model.value = localFilters.value
    }
  }

  const addNewFilter = () => {
    const newFilter = {
      id: Date.now(),
      field: '',
      operator: '',
      value: '',
      logicalOperator: 'AND'
    }
    localFilters.value.push(newFilter)
    model.value = localFilters.value
  }

  const addFilterAfter = (filterId) => {
    const index = localFilters.value.findIndex((filterItem) => filterItem.id === filterId)
    if (index > -1) {
      const newFilter = {
        id: Date.now(),
        field: '',
        operator: '',
        value: '',
        logicalOperator: 'AND'
      }
      localFilters.value.splice(index + 1, 0, newFilter)
      model.value = localFilters.value
    }
  }

  const removeFilter = (filterId) => {
    const index = localFilters.value.findIndex((filterItem) => filterItem.id === filterId)
    if (index > -1) {
      localFilters.value.splice(index, 1)
      emit('remove-filter', filterId)
      model.value = localFilters.value
    }
  }

  const generatePreview = () => {
    if (localFilters.value.length === 0) {
      return 'No filters defined'
    }

    return localFilters.value
      .map((filter, index) => {
        if (!filter.field || !filter.operator || !filter.value) {
          return 'filter value is invalid or incomplete'
        }

        const logicalOp = index > 0 ? ` ${filter.logicalOperator} ` : ''
        return `${logicalOp}${filter.field} ${filter.operator} ${filter.value}`
      })
      .join('')
  }

  const updateCustomLabel = () => {
    // Emit custom label change
  }

  const toggleQueryDSL = () => {
    showQueryDSL.value = !showQueryDSL.value
  }

  const addFilter = () => {
    const filterData = {
      filters: localFilters.value,
      label: customLabel.value
    }
    emit('add-filter', filterData)
  }

  const cancel = () => {
    // Reset to original state
    localFilters.value = [...model.value]
    customLabel.value = ''
  }

  // Watchers
  watch(
    () => model.value,
    (newValue) => {
      localFilters.value = [...newValue]
    },
    { deep: true }
  )

  // Initialize with one empty filter if none exists
  if (localFilters.value.length === 0) {
    addNewFilter()
  }
</script>
