<script setup>
  import { computed, ref, inject } from 'vue'
  import { useJsonFormsControl, rendererProps } from '@jsonforms/vue'
  import fieldDropdown from '@aziontech/webkit/field-dropdown'

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
    isChanged.value = true
    handleChange(path.value, value)
    emit('change', value)
  }

  const onBlur = () => {
    emit('blur')
  }
</script>

<template>
  <div class="flex flex-col gap-2">
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
