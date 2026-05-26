<template>
  <div>
    <div class="border-b px-4 sm:px-6 md:px-8 py-2.5 justify-between surface-border flex">
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
    <div class="px-4 sm:px-6 md:px-8 py-6 flex gap-2 flex-col">
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


    <!-- Footer Buttons -->
    <div
      class="px-4 sm:px-6 md:px-8 py-3 border-t surface-border flex gap-2 items-center justify-end p-dialog-footer"
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
  import PrimeButton from '@aziontech/webkit/button'
  import FilterRow from '../filterRow/index.vue'
  import Divider from '@aziontech/webkit/divider'
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
  // Accept both v2-pipeline shape ({ valueField, operator, value, type, ... })
  // and the internal row shape ({ field, operator, value, ... }).
  if (model.value && Array.isArray(model.value) && model.value.length > 0) {
    filterRows.value = model.value.map((filter, index) => ({
      id: index + 1,
      field: filter.valueField || filter.field || null,
      fieldValue: filter.valueField || filter.fieldValue || null,
      operator: filter.operator || null,
      operatorType: filter.type || filter.operatorType || null,
      operatorFormat: filter.format || filter.operatorFormat || null,
      value: filter.value || '',
      rawValue: filter.rawValue ?? filter.value ?? '',
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

  // Output shape consumed by the v2 pipeline (useEventsData, FilterTagsDisplay, AQL).
  const processFilterRow = (row) => {
    return {
      valueField: row.field,
      operator: row.operator,
      operatorType: row.operatorType,
      value: row.value,
      rawValue: row.rawValue,
      type: row.operatorType || 'String',
      logicalOperator: row.logicalOperator || 'OR'
    }
  }

  const addFilter = () => {
    if (!isFormValid.value) return

    const flat = filterRows.value.map(processFilterRow)

    // Update the model as a flat array so the rest of the v2 pipeline
    // (useEventsData buildApiFilters, FilterTagsDisplay) can consume it.
    model.value = flat

    emit('apply-filter', {
      filters: flat
    })
  }
</script>
