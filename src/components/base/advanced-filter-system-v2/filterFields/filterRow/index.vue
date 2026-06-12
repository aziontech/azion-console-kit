<template>
  <div class="flex flex-col gap-3">
    <!-- Filter Row Content
         Mobile (<640px): stacks vertically — each dropdown/input gets its
         own row, action buttons wrap to a final row.
         Tablet+: horizontal layout as designed. -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 w-full min-w-0">
      <Dropdown
        ref="fieldDropdownRef"
        id="filter-field"
        v-model="selectedField"
        @change="selectedFieldChange"
        :options="props.fields"
        resetFilterOnHide
        filter
        autoFilterFocus
        optionLabel="label"
        optionValue="value"
        class="flex-1 min-w-0"
        placeholder="Select a field"
        filterIcon="pi pi-search"
        @show="onDropdownShow"
      />

      <Dropdown
        appendTo="body"
        id="filter-operator"
        v-model="selectedOperator"
        :disabled="listOperatorsDisabled"
        :options="listOperators"
        optionLabel="label"
        placeholder="Select an operator"
        class="flex-1 min-w-0 sm:flex-0"
      />

      <component
        :is="componentRender"
        v-model:value="filterValue"
        v-bind="selectedOperator?.props"
        class="flex-1 min-w-0"
        :placeholder="selectedField ? 'Enter value...' : 'Please select a field first...'"
        :disabled="!selectedField"
      />

      <!-- Action Buttons — wrap so they reflow on tight viewports -->
      <div class="flex flex-wrap gap-1 sm:flex-shrink-0 sm:ml-auto">
        <!-- Add AND Button. OR is intentionally omitted: the events GraphQL
             filter is AND-only, so an OR connector cannot be honored. -->
        <PrimeButton
          outlined
          icon="pi pi-plus"
          label="AND"
          size="small"
          @click="$emit('add-rule', 'AND')"
        />

        <!-- Delete Button (disabled for first row) -->
        <PrimeButton
          type="button"
          icon="pi pi-trash"
          severity="danger"
          outlined
          size="small"
          :disabled="props.rowIndex === 0"
          @click="$emit('remove', props.rowIndex)"
        />
      </div>
    </div>

    <!-- Operator Dropdown (hidden by default) -->
    <div
      v-if="showOperatorDropdown"
      class="absolute z-50 mt-1"
    >
      <Dropdown
        v-model="selectedOperator"
        :options="listOperators"
        optionLabel="label"
        placeholder="Select an operator"
        @change="showOperatorDropdown = false"
        @hide="showOperatorDropdown = false"
      />
    </div>
  </div>
</template>

<script setup>
  import { computed, defineModel, ref, watch } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import Dropdown from '@aziontech/webkit/dropdown'
  import { FIELDS_MAPPING, OPERATOR_MAPPING } from './component'

  defineOptions({ name: 'FilterRow' })

  // Model
  const modelValue = defineModel({
    type: Object,
    required: true
  })

  // Props
  const props = defineProps({
    fields: {
      type: Array,
      required: true
    },
    rowIndex: {
      type: Number,
      required: true
    },
    isLast: {
      type: Boolean,
      default: false
    },
    editFilter: {
      type: Boolean,
      default: false
    },
    shouldFocus: {
      type: Boolean,
      default: false
    }
  })

  // Emits
  defineEmits(['remove', 'add-rule'])

  // Refs
  const selectedField = ref(null)
  const selectedOperator = ref(null)
  const filterValue = ref(null)
  const fieldDropdownRef = ref(null)
  const showOperatorDropdown = ref(false)

  // Computed properties
  const componentRender = computed(() => {
    return FIELDS_MAPPING[selectedOperator.value?.type] || FIELDS_MAPPING['String']
  })

  const listOperators = computed(() => {
    const raw = props.fields.find((field) => field.value === selectedField.value)?.operator || []
    // Decorate each operator with a human-readable label from OPERATOR_MAPPING.
    // The raw operator value (e.g. "Eq", "Lt", "Lte") comes from the GraphQL
    // introspection and is unfriendly for end users — display "Equals",
    // "Less Than", "Less Than or Equal", etc. instead.
    return raw.map((op) => ({
      ...op,
      label: OPERATOR_MAPPING[op.value]?.label || op.value
    }))
  })

  const selectedFieldOption = computed(() => {
    return props.fields.find((field) => field.value === selectedField.value) || null
  })

  const listOperatorsDisabled = computed(() => {
    return selectedFieldOption.value?.disabled || false
  })

  // Methods
  const selectedFieldChange = () => {
    if (listOperators.value.length === 1) {
      selectedOperator.value = listOperators.value[0]
    } else {
      selectedOperator.value = null
    }
    filterValue.value = null
  }

  // Sync selectedField to modelValue.field
  watch(selectedField, (newField) => {
    modelValue.value = {
      ...modelValue.value,
      field: newField,
      fieldValue: newField
    }
  })

  // Sync selectedOperator (operator name + type) to modelValue
  watch(selectedOperator, (newOp) => {
    modelValue.value = {
      ...modelValue.value,
      operator: newOp?.value || null,
      operatorType: newOp?.type || null,
      operatorFormat: newOp?.format || null
    }
  })

  // Watch for filter value changes
  watch(filterValue, (newValue) => {
    if (selectedOperator.value) {
      let processedValue = newValue

      // Process value based on operator type
      if (['Like', 'Ilike'].includes(selectedOperator.value.value)) {
        processedValue = `%${newValue}%`
      } else if (['Boolean', 'StringObject'].includes(selectedOperator.value.type)) {
        processedValue = newValue
      }

      modelValue.value = {
        ...modelValue.value,
        value: processedValue,
        rawValue: newValue
      }
    }
  })

  // Hydrate the row from pre-populated model data so the panel mirrors filters
  // that were added elsewhere — typed into the AQL input, restored from a
  // recent/saved query, or injected by a chart-legend click — instead of
  // showing blank dropdowns. Runs for any row that already carries a field
  // (the default "add filter" row has `field: null`, so it is skipped).
  //
  // Shapes (v2, flat):
  //   props.fields item → { label, value, operator: [{ value, type, props }] }
  //   modelValue (row)  → { field: <field.value>, operator: <op.value>, value, rawValue, ... }
  if (modelValue.value?.field) {
    selectedField.value = modelValue.value.field
    // `listOperators` is reactive to `selectedField` and already decorates each
    // operator with its display label, so the object we pick matches what the
    // operator Dropdown renders.
    const operator = listOperators.value.find((op) => op.value === modelValue.value.operator)
    if (operator) selectedOperator.value = operator
    filterValue.value = modelValue.value.rawValue ?? modelValue.value.value ?? null
  }
</script>
