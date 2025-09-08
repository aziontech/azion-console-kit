<template>
  <div>
    <div class="border-b px-8 py-2.5 justify-between surface-border flex">
      <h3 class="text-sm font-semibold text-color">Add filter</h3>
      <PrimeButton
        icon="pi pi-times"
        severity="primary"
        size="small"
        outlined
        @click="$emit('cancel')"
      />
    </div>

    <!-- Filter Rows -->
    <div class="px-8 py-6 flex gap-2 flex-col">
      <div
        v-for="(filterRow, rowIndex) in filterRows"
        :key="rowIndex"
        class="flex flex-col gap-1"
      >
        <FilterRow
          v-model="filterRows[rowIndex]"
          :fields="props.filtersOptions"
          :row-index="rowIndex"
          :is-last="rowIndex === filterRows.length - 1"
          :edit-filter="false"
          @remove="removeFilterRow"
          @add-rule="addFilterRow"
        />

        <!-- Logical Operator Divider -->
        <div
          v-if="rowIndex < filterRows.length - 1"
          class="flex justify-center items-center"
        >
          <Divider
            align="left"
            type="solid"
          >
            <p class="font-semibold text-color-secondary text-xs">
              {{ filterRows[rowIndex].logicalOperator || 'OR' }}
            </p>
          </Divider>
        </div>
      </div>
    </div>

    <!-- Preview Section -->
    <div class="px-8 py-4 border-t surface-border">
      <div class="flex items-center gap-2 mb-3">
        <i class="pi pi-search text-color-secondary"></i>
        Preview
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

      <!-- JSON Preview -->
      <div class="mt-4 p-3 bg-gray-50 rounded-lg">
        <h5 class="text-sm font-medium text-gray-700 mb-2">JSON Structure:</h5>
        <pre class="text-xs text-gray-600 overflow-auto">{{
          JSON.stringify(generateFilterStructure(), null, 2)
        }}</pre>
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
        @click="$emit('cancel')"
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
  </div>
</template>

<script setup>
  import { ref, computed, defineModel } from 'vue'
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import FilterRow from '../filterRow/index.vue'
  import Divider from 'primevue/divider'
  defineOptions({ name: 'FilterPanel' })

  // Model
  const model = defineModel({
    type: [Array, Object],
    default: () => []
  })

  // Props
  const props = defineProps({
    filtersOptions: {
      type: Array,
      required: true
    }
  })

  // Emits
  const emit = defineEmits(['apply-filter', 'cancel'])

  // Refs
  const customLabel = ref('')

  // Filter rows structure - flat structure
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
    return validationErrors.value.length === 0
  })

  // Methods
  const addFilterRow = (logicalOperator = 'OR') => {
    const newRow = {
      id: Date.now(),
      field: null,
      operator: null,
      value: '',
      logicalOperator: logicalOperator
    }
    filterRows.value.push(newRow)
  }

  const removeFilterRow = (index) => {
    if (filterRows.value.length > 1) {
      filterRows.value.splice(index, 1)
    }
  }

  const generateFilterStructure = () => {
    if (filterRows.value.length === 0) return {}

    if (filterRows.value.length === 1) {
      return processFilterRow(filterRows.value[0])
    }

    return {
      condition: 'AND',
      rules: filterRows.value.map((row) => processFilterRow(row))
    }
  }

  const processFilterRow = (row) => {
    return {
      field: row.field,
      operator: row.operator,
      value: row.value
    }
  }

  const addFilter = () => {
    if (!isFormValid.value) return

    const filterStructure = generateFilterStructure()

    const filterData = {
      filters: filterStructure,
      customLabel: customLabel.value
    }

    // Update the model
    model.value = filterStructure

    // Emit the filter data
    emit('apply-filter', filterData)
  }

  const updateCustomLabel = () => {
    // Handle custom label update
  }
</script>
