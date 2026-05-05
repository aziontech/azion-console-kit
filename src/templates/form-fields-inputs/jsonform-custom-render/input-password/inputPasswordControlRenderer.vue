<script setup>
  import { computed, ref, inject } from 'vue'
  import { useJsonFormsControl, rendererProps } from '@jsonforms/vue'
  import fieldPassword from '@aziontech/webkit/field-password'

  const emit = defineEmits(['change', 'blur'])
  const props = defineProps(rendererProps())

  const { control, handleChange } = useJsonFormsControl(props)
  const isChanged = ref(false)
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
  // Show error when field was changed OR when validation was attempted (e.g., on form submit)
  const errorMessage = computed(() => {
    // If field is required and empty, show "Required" message
    if ((isChanged.value || validationAttempted.value) && isRequiredAndEmpty.value) {
      return 'Required'
    }
    // Otherwise show validation error if any
    return isChanged.value || validationAttempted.value ? error.value : ''
  })

  const onChange = (value) => {
    isChanged.value = true
    handleChange(path.value, value)
    emit('change', value)
  }

  const onBlur = (event) => {
    const value = event.target?.value
    handleChange(path.value, value)
    emit('blur', value)
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <fieldPassword
      :name="path"
      :label="label"
      :description="description"
      :required="required"
      :additionalError="errorMessage"
      @blur="onBlur"
      @input="onChange"
    />
  </div>
</template>
