<script setup>
  import { computed, ref, inject, watch } from 'vue'
  import { useJsonFormsControl, rendererProps } from '@jsonforms/vue'
  import fieldInputTextPrivacy from '@/templates/form-fields-inputs/fieldInputTextPrivacy.vue'

  const emit = defineEmits(['change', 'blur'])
  const props = defineProps(rendererProps())

  const { control, handleChange } = useJsonFormsControl(props)
  const isChanged = ref(false)
  const isPublic = ref(true)

  // Inject the function to update privacy field state
  const updatePrivacyFieldState = inject('updatePrivacyFieldState', () => {})
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
  const disabled = computed(() => !control.value.enabled || control.value.schema.readOnly)

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

  const onUpdateIsPublic = (value) => {
    isPublic.value = value
    // Notify parent about isPublic change
    updatePrivacyFieldState(path.value, value)
  }

  // Watch for changes and notify parent
  watch(
    isPublic,
    (newValue) => {
      updatePrivacyFieldState(path.value, newValue)
    },
    { immediate: true }
  )

  // Expose isPublic value for parent to retrieve
  defineExpose({
    isPublic: computed(() => isPublic.value)
  })
</script>

<template>
  <div class="flex flex-col gap-2">
    <fieldInputTextPrivacy
      :name="path"
      :label="label"
      :description="description"
      :required="required"
      :aditionalError="errorMessage"
      :isPublic="isPublic"
      :disabled="disabled"
      @blur="onBlur"
      @input="onChange"
      @update:isPublic="onUpdateIsPublic"
    />
  </div>
</template>
