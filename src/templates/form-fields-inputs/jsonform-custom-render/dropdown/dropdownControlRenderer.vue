<script setup>
  import { computed, ref, inject } from 'vue'
  import { useJsonFormsControl, rendererProps } from '@jsonforms/vue'
  import fieldDropdown from '@aziontech/webkit/field-dropdown'

  const emit = defineEmits(['change', 'blur'])
  const props = defineProps(rendererProps())

  const { control, handleChange } = useJsonFormsControl(props)
  const isBlurred = ref(false)
  // Store the error at blur/change time to prevent updates during interaction
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
  // Show error only after blur/change or validation attempted - use stored blurredError to prevent updates during interaction
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

  const placeholder = computed(() => control.value.schema.placeholder || '')
  const filter = computed(() => control.value.schema.filter || false)
  const loading = computed(() => control.value.schema.loading || false)
  const disabled = computed(
    () => !control.value.enabled || control.value.schema.readOnly || control.value.schema.disabled
  )

  const options = computed(() => {
    if (control.value.schema.oneOf) {
      return control.value.schema.oneOf.map((item) => ({
        label: item.title || item.const,
        value: item.const
      }))
    }
    return []
  })

  const optionLabel = computed(() => control.value.schema.optionLabel || 'label')
  const optionValue = computed(() => control.value.schema.optionValue || 'value')

  const onChange = (value) => {
    isBlurred.value = true
    handleChange(path.value, value)
    // Capture the error at change time for dropdown
    if (isRequiredAndEmpty.value) {
      blurredError.value = 'Required'
    } else {
      blurredError.value = error.value
    }
    emit('change', value)
  }

  const onBlur = () => {
    isBlurred.value = true
    // Capture the error at blur time
    if (isRequiredAndEmpty.value) {
      blurredError.value = 'Required'
    } else {
      blurredError.value = error.value
    }
    emit('blur')
  }
</script>

<template>
  <div
    class="flex flex-col gap-2"
    :class="{ '[&_small.p-error]:hidden': errorMessage === 'Required' }"
  >
    <fieldDropdown
      :name="path"
      :label="label"
      :description="description"
      :required="required"
      :options="options"
      :optionLabel="optionLabel"
      :optionValue="optionValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :filter="filter"
      :loading="loading"
      :additionalError="errorMessage"
      @onChange="onChange"
      @onBlur="onBlur"
    />
  </div>
</template>
