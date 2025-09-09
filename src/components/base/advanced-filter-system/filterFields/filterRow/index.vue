<template>
  <div class="flex flex-col gap-3">
    <!-- Filter Row Content -->
    <div class="flex items-center gap-3 w-full">
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
        class="w-full"
        placeholder="Select a field"
        filterIcon="pi pi-search"
        @show="onDropdownShow"
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

      <component
        :is="componentRender"
        v-model:value="filterValue"
        v-bind="selectedOperator?.props"
        class="w-full"
        :placeholder="selectedField ? 'Enter value...' : 'Please select a field first...'"
        :disabled="!selectedField"
      />

      <!-- Action Buttons -->
      <div class="flex gap-1">
        <!-- Add OR Button -->
        <PrimeButton
          outlined
          icon="pi pi-plus"
          label="OR"
          size="small"
          @click="$emit('add-rule', 'OR')"
        />

        <!-- Add AND Button -->
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
        optionLabel="value"
        optionValue="type"
        placeholder="Select an operator"
        @change="showOperatorDropdown = false"
        @hide="showOperatorDropdown = false"
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
    return FIELDS_MAPPING[selectedOperator.value] || FIELDS_MAPPING['String']
  })

  const listOperators = computed(() => {
    return props.fields.find((field) => field.value === selectedField.value)?.operator || []
  })

  const listOperatorsDisabled = computed(() => {
    return selectedField.value?.disabled || false
  })

  // Methods
  const selectedFieldChange = () => {
    if (listOperators.value.length === 1) {
      selectedOperator.value = listOperators.value[0].type
    } else {
      selectedOperator.value = null
    }
    filterValue.value = null
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
