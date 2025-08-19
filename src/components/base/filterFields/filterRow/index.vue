<template>
  <div class="flex flex-col gap-3">
    <!-- Filter Row -->
    <div class="flex items-center gap-3 w-full">
      <Dropdown
        id="filter-field"
        v-model="selectedField"
        :options="props.fields"
        resetFilterOnHide
        filter
        autoFilterFocus
        optionLabel="label"
        optionValue="value"
        class="w-full"
        placeholder="Select a field"
        filterIcon="pi pi-search"
      />

      <Dropdown
        appendTo="self"
        id="filter-operator"
        v-model="selectedOperator"
        :disabled="listOperatorsDisabled"
        :options="listOperators"
        optionLabel="value"
        optionValue="type"
        placeholder="Select an operator"
      />
      <!-- Value Input -->
      <div class="flex-1">
        {{ selectedOperator }}
        <component
          :is="componentRender"
          v-model:value="filterValue"
          v-bind="selectedOperator?.props"
          class="w-full"
        />
      </div>

      <!-- Delete Button -->
      <PrimeButton
        type="button"
        icon="pi pi-trash"
        severity="danger"
        outlined
        size="small"
        @click="$emit('remove', props.rowIndex)"
      />

      <!-- Logical Operators -->
      <div class="flex gap-1">
        <PrimeButton
          type="button"
          icon="pi pi-plus-circle"
          label="OR"
          :outlined="modelValue.logicalOperator !== 'OR'"
          :severity="modelValue.logicalOperator === 'OR' ? 'primary' : 'secondary'"
          size="small"
          @click="setLogicalOperator('OR')"
        />
        <PrimeButton
          type="button"
          icon="pi pi-plus-circle"
          label="AND"
          :outlined="modelValue.logicalOperator !== 'AND'"
          :severity="modelValue.logicalOperator === 'AND' ? 'primary' : 'secondary'"
          size="small"
          @click="setLogicalOperator('AND')"
        />
      </div>
    </div>

    <!-- Logical Operator Display -->
    <div
      v-if="!props.isLast"
      class="flex justify-center"
    >
      <span class="text-lg font-bold text-color">{{ modelValue.logicalOperator || 'OR' }}</span>
    </div>

    <!-- Add New Filter Row Button -->
    <div
      v-if="props.isLast"
      class="flex justify-center pt-2"
    >
      <PrimeButton
        type="button"
        icon="pi pi-plus"
        label="Add Filter"
        outlined
        size="small"
        @click="$emit('add-row')"
      />
    </div>
  </div>
</template>

<script setup>
  import { computed, defineModel, ref, watch } from 'vue'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import { FIELDS_MAPPING } from '@/components/base/filterFields/filterRow/component'

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
    }
  })

  // Emits
  defineEmits(['remove', 'add-row'])

  // Refs
  const selectedField = ref(null)
  const selectedOperator = ref(null)
  const filterValue = ref(null)

  // Computed properties
  const componentRender = computed(() => {
    return FIELDS_MAPPING[selectedOperator.value] || FIELDS_MAPPING['String']
  })

  const listOperators = computed(() => {
    return props.fields.find((field) => field.value === selectedField.value)?.operator || []
  })

  const listOperatorsDisabled = computed(() => {
    return selectedField.value?.disabled || false
  })

  // Methods
  const onFieldChange = () => {
    selectedOperator.value = null
    filterValue.value = null

    // Update model
    modelValue.value = {
      ...modelValue.value,
      field: selectedField.value?.label,
      fieldValue: selectedField.value?.value,
      operator: null,
      value: null
    }

    // Auto-select operator if only one available
    const oneResult = selectedField.value?.operator.length === 1
    if (oneResult) {
      onOperatorChange({ value: selectedField.value.operator[0] })
      inputOperatorDisabled.value = true
    }
  }

  const onOperatorChange = ({ value }) => {
    selectedOperator.value = value
    filterValue.value = null

    // Update model
    modelValue.value = {
      ...modelValue.value,
      operator: value.value,
      operatorType: value.type,
      operatorFormat: value.format
    }
  }

  const setLogicalOperator = (operator) => {
    modelValue.value.logicalOperator = operator
  }

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

  // Initialize from model if editing
  if (props.editFilter && modelValue.value.field) {
    const field = props.fields.find(
      ({ value }) =>
        value.value === modelValue.value.fieldValue && value.label === modelValue.value.field
    )
    if (field) {
      selectedField.value = field.value
      const operator = selectedField.value.operator.find(
        ({ value }) => value.value === modelValue.value.operator
      )
      if (operator) {
        selectedOperator.value = operator.value
        filterValue.value = modelValue.value.rawValue || modelValue.value.value
      }
    }
  }
</script>
