<template>
  <div>
    <PrimeButton
      icon="pi pi-filter"
      label="Advanced Filter"
      outlined
      size="small"
      @click="toggleOverPanel"
    />

    <!-- OverPanel -->
    <OverlayPanel
      ref="overPanelRef"
      appendTo="body"
      aria-haspopup="true"
      aria-controls="overlay_panel"
      class="max-h-[600px] overflow-y-auto"
      :pt="{
        root: { class: 'p-0 md:w-[90%] max-sm:w-full' },
        content: { class: 'p-0' }
      }"
    >
      <div class="border-b px-8 py-5 justify-between surface-border flex">
        <h3 class="text-lg font-semibold text-color">Add filter</h3>
        <PrimeButton
          icon="pi pi-times"
          severity="primary"
          outlined
          @click="toggleOverPanel"
        />
      </div>

      <!-- Filter Rows -->
      <div class="px-8 py-6 flex gap-4 flex-col">
        <div
          v-for="(filterRow, rowIndex) in filterRows"
          :key="rowIndex"
          class="flex flex-col gap-3"
        >
          <!-- Filter Row -->
          <div class="flex items-center gap-3 w-full">
            <span class="text-lg font-medium text-color">=</span>

            <!-- Field Dropdown -->
            <Dropdown
              appendTo="self"
              v-model="filterRow.field"
              :options="props.fields"
              resetFilterOnHide
              filter
              autoFilterFocus
              optionLabel="label"
              optionValue="value"
              class="w-48"
              placeholder="Select a field"
              filterIcon="pi pi-search"
              @change="onFieldChange(rowIndex)"
            />

            <!-- Operator Button -->
            <PrimeButton
              type="button"
              :label="filterRow.operator || 'Select operator'"
              outlined
              size="small"
              @click="showOperatorDropdown(rowIndex)"
            />

            <!-- Value Input -->
            <InputText
              v-model="filterRow.value"
              :placeholder="getValuePlaceholder(filterRow)"
              class="flex-1"
              @input="onValueChange(rowIndex)"
            />

            <!-- Delete Button -->
            <PrimeButton
              type="button"
              icon="pi pi-trash"
              severity="danger"
              outlined
              size="small"
              @click="removeFilterRow(rowIndex)"
            />

            <!-- Logical Operators -->
            <div class="flex gap-1">
              <PrimeButton
                type="button"
                icon="pi pi-plus-circle"
                label="OR"
                :outlined="filterRow.logicalOperator !== 'OR'"
                :severity="filterRow.logicalOperator === 'OR' ? 'primary' : 'secondary'"
                size="small"
                @click="setLogicalOperator(rowIndex, 'OR')"
              />
              <PrimeButton
                type="button"
                icon="pi pi-plus-circle"
                label="AND"
                :outlined="filterRow.logicalOperator !== 'AND'"
                :severity="filterRow.logicalOperator === 'AND' ? 'primary' : 'secondary'"
                size="small"
                @click="setLogicalOperator(rowIndex, 'AND')"
              />
            </div>
          </div>

          <!-- Logical Operator Display -->
          <div
            v-if="rowIndex < filterRows.length - 1"
            class="flex justify-center"
          >
            <span class="text-lg font-bold text-color">{{
              filterRow.logicalOperator || 'OR'
            }}</span>
          </div>
        </div>

        <!-- Add New Filter Row Button -->
        <div class="flex justify-center pt-2">
          <PrimeButton
            type="button"
            icon="pi pi-plus"
            label="Add Filter"
            outlined
            size="small"
            @click="addFilterRow"
          />
        </div>
      </div>

      <!-- Preview Section -->  
      <div class="px-8 py-4 border-t surface-border">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-search text-color-secondary"></i>
          <h4 class="text-md font-medium text-color">Preview</h4>
        </div>

        <div class="flex flex-wrap gap-2">
          <div
            v-for="(error, index) in validationErrors"
            :key="index"
            class="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg"
          >
            <i class="pi pi-exclamation-triangle text-orange-500"></i>
            <span class="text-sm text-gray-700">{{ error }}</span>
            <span
              v-if="index < validationErrors.length - 1"
              class="text-blue-500 font-medium"
              >OR</span
            >
          </div>
        </div>
      </div>

      <!-- Custom Label Section -->
      <div class="px-8 py-5 flex gap-3.5 flex-col">
        <label class="text-sm font-medium text-color">Custom label (optional)</label>
        <InputText
          v-model="customLabel"
          placeholder="Add a custom label here"
          class="w-full"
          @input="updateCustomLabel"
        />
      </div>

      <!-- Footer Buttons -->
      <div
        class="px-8 py-3 border-t surface-border flex gap-2 items-center justify-end p-dialog-footer"
      >
        <PrimeButton
          type="button"
          label="Cancel"
          @click="cancel"
          class="max-md:min-w-max"
          severity="primary"
          size="small"
          outlined
          data-testid="filter-cancel-button"
        />
        <PrimeButton
          type="button"
          class="max-md:w-full"
          label="Add filter"
          severity="secondary"
          size="small"
          :disabled="!isFormValid"
          @click="addFilter"
          data-testid="filter-apply-button"
        />
      </div>
    </OverlayPanel>

    <!-- Operator Dropdown Overlay -->
    <OverlayPanel
      ref="operatorPanelRef"
      appendTo="body"
      class="w-48"
    >
      <div class="p-2">
        <div
          v-for="operator in availableOperators"
          :key="operator.value"
          class="p-2 hover:bg-gray-100 rounded cursor-pointer"
          @click="selectOperator(operator)"
        >
          {{ operator.label }}
        </div>
      </div>
    </OverlayPanel>
  </div>
</template>

<script setup>
  import { ref, computed, defineModel } from 'vue'
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import OverlayPanel from 'primevue/overlaypanel'
  import Dropdown from 'primevue/dropdown'

  // Model
  const model = defineModel({
    type: [Array, Object],
    default: () => []
  })

  // Props
  const props = defineProps({
    fields: {
      type: Array,
      default: () => []
    }
  })

  // Component name
  defineOptions({ name: 'AdvancedFilter' })

  // Emits
  const emit = defineEmits(['apply-filter'])

  // Refs
  const overPanelRef = ref(null)
  const operatorPanelRef = ref(null)
  const customLabel = ref('')
  const currentOperatorRow = ref(null)

  // Filter rows structure
  const filterRows = ref([
    {
      id: 1,
      field: null,
      operator: null,
      value: '',
      logicalOperator: 'OR'
    }
  ])

  // Initialize filterRows from model if available
  if (model.value && Array.isArray(model.value) && model.value.length > 0) {
    filterRows.value = model.value.map((filter, index) => ({
      id: index + 1,
      field: filter.field || null,
      operator: filter.operator || null,
      value: filter.value || '',
      logicalOperator: filter.logicalOperator || 'OR'
    }))
  }

  // Available operators
  const availableOperators = ref([
    { value: 'eq', label: 'Equals' },
    { value: 'ne', label: 'Not Equals' },
    { value: 'like', label: 'Contains' },
    { value: 'ilike', label: 'Not Contains' },
    { value: 'gt', label: 'Greater Than' },
    { value: 'gte', label: 'Greater Than or Equal' },
    { value: 'lt', label: 'Less Than' },
    { value: 'lte', label: 'Less Than or Equal' },
    { value: 'in', label: 'In' },
    { value: 'between', label: 'Between' }
  ])

  // Computed properties
  const validationErrors = computed(() => {
    const errors = []

    filterRows.value.forEach((row, index) => {
      if (!row.field) {
        errors.push(`Filter ${index + 1}: field is invalid or incomplete`)
      }
      if (!row.operator) {
        errors.push(`Filter ${index + 1}: operator is invalid or incomplete`)
      }
      if (!row.value && row.operator !== 'in') {
        errors.push(`Filter ${index + 1}: value is invalid or incomplete`)
      }
    })

    return errors
  })

  const isFormValid = computed(() => {
    return filterRows.value.every(
      (row) => row.field && row.operator && (row.value || row.operator === 'in')
    )
  })

  // Methods
  const toggleOverPanel = (event) => {
    overPanelRef.value.toggle(event)
  }

  const toggleQueryDSL = () => {
    // TODO: Implement Query DSL toggle
    // Emit event or handle Query DSL toggle
  }

  const addFilterRow = () => {
    const newRow = {
      id: Date.now(),
      field: null,
      operator: null,
      value: '',
      logicalOperator: 'OR'
    }
    filterRows.value.push(newRow)
  }

  const removeFilterRow = (index) => {
    if (filterRows.value.length > 1) {
      filterRows.value.splice(index, 1)
    }
  }

  const onFieldChange = (rowIndex) => {
    // Reset operator and value when field changes
    filterRows.value[rowIndex].operator = null
    filterRows.value[rowIndex].value = ''
  }

  const showOperatorDropdown = (rowIndex) => {
    currentOperatorRow.value = rowIndex
    operatorPanelRef.value.toggle(event)
  }

  const selectOperator = (operator) => {
    if (currentOperatorRow.value !== null) {
      filterRows.value[currentOperatorRow.value].operator = operator.label
    }
    operatorPanelRef.value.hide()
  }

  const onValueChange = () => {
    // Handle value changes
    // Emit event or handle value changes
  }

  const setLogicalOperator = (rowIndex, operator) => {
    filterRows.value[rowIndex].logicalOperator = operator
  }

  const getValuePlaceholder = (filterRow) => {
    if (!filterRow.field) return 'Please select a field first...'
    if (!filterRow.operator) return 'Please select an operator first...'

    // Return appropriate placeholder based on field and operator
    return 'Enter value...'
  }

  const addFilter = () => {
    if (!isFormValid.value) return

    const filterData = {
      filters: filterRows.value.map((row) => ({
        field: row.field,
        operator: row.operator,
        value: row.value,
        logicalOperator: row.logicalOperator
      })),
      customLabel: customLabel.value
    }

    // Update the model if it's an array
    if (Array.isArray(model.value)) {
      model.value = filterData.filters
    }

    // Emit the filter data
    emit('apply-filter', filterData)

    // Close the panel
    overPanelRef.value.hide()
  }

  const cancel = () => {
    filterRows.value = [
      {
        id: 1,
        field: null,
        operator: null,
        value: '',
        logicalOperator: 'OR'
      }
    ]
    customLabel.value = ''
    overPanelRef.value.hide()
  }

  const updateCustomLabel = () => {
    // Handle custom label update
    // TODO: Emit custom label update to parent component
  }
</script>

<style scoped>
  .p-overlaypanel {
    max-width: 90vw;
  }

  @media (max-width: 768px) {
    .p-overlaypanel {
      max-width: 95vw;
    }
  }
</style>
