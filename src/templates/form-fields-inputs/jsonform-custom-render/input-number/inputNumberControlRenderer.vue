<script setup>
  import { computed, ref, inject } from 'vue'
  import { useJsonFormsControl, rendererProps } from '@jsonforms/vue'
  import fieldNumber from '@aziontech/webkit/field-number'

  const emit = defineEmits(['change', 'blur'])
  const props = defineProps(rendererProps())

  const { control, handleChange } = useJsonFormsControl(props)
  const isBlurred = ref(false)
  // Store the error at blur time to prevent updates during typing
  const blurredError = ref('')
  // Inject validationAttempted to show errors when validation is triggered
  const validationAttempted = inject('validationAttempted', ref(false))
  // Inject function to check if field is required and empty
  const isFieldRequiredAndEmpty = inject('isFieldRequiredAndEmpty', () => false)

  const description = computed(() => control.value.description)
  const label = computed(() => control.value.schema.label)
  const path = computed(() => control.value.path)
  const required = computed(() => control.value.required)
  // Use custom error from schema if available, otherwise use the JSON Forms validation error
  const error = computed(() => {
    if (!control.value.errors) return ''
    return control.value.schema.error || control.value.errors
  })
  // Check if this field is required and empty (for showing "Required" message)
  const isRequiredAndEmpty = computed(() => {
    const fieldName = path.value
    return isFieldRequiredAndEmpty(fieldName)
  })
  // Show error only after blur or validation attempted - use stored blurredError to prevent updates during typing
  const errorMessage = computed(() => {
    // If validation was attempted (e.g., form submit), show current error
    if (validationAttempted.value) {
      if (isRequiredAndEmpty.value) return 'Required'
      return error.value
    }
    // If field was blurred, show the stored error from blur time
    if (isBlurred.value) {
      return blurredError.value
    }
    return ''
  })
  const min = computed(() => control.value.schema.minimum)
  const max = computed(() => control.value.schema.maximum)
  const step = computed(() => control.value.schema.multipleOf || 1)
  const showButtons = computed(() => control.value.schema.showButtons ?? true)
  const useGrouping = computed(() => (control.value.schema.type === 'number' ? true : false))
  const disabled = computed(() => !control.value.enabled || control.value.schema.readOnly)

  const onChange = (value) => {
    handleChange(path.value, value)
    emit('change', value)
  }

  const onBlur = (event) => {
    isBlurred.value = true
    const value = event.target?.value
    handleChange(path.value, value)
    // Capture the error at blur time to prevent it from updating during typing
    if (isRequiredAndEmpty.value) {
      blurredError.value = 'Required'
    } else {
      blurredError.value = error.value
    }
    emit('blur', value)
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <fieldNumber
      :name="path"
      :label="label"
      :description="description"
      :required="required"
      :additionalError="errorMessage"
      :min="min"
      :max="max"
      :step="step"
      :showButtons="showButtons"
      :useGrouping="useGrouping"
      :disabled="disabled"
      @blur="onBlur"
      @input="onChange"
    />
  </div>
</template>
