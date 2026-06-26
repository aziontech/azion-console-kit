<script setup>
  import { computed, ref, inject, watch } from 'vue'
  import { useJsonFormsControl, rendererProps } from '@jsonforms/vue'
  import fieldInputTextPrivacy from '@/templates/form-fields-inputs/fieldInputTextPrivacy.vue'

  const emit = defineEmits(['change', 'blur'])
  const props = defineProps(rendererProps())

  const { control, handleChange } = useJsonFormsControl(props)
  const isBlurred = ref(false)
  // Store the error at blur time to prevent updates during typing
  const blurredError = ref('')
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
  const disabled = computed(() => !control.value.enabled || control.value.schema.readOnly)

  /**
   * Coerce the raw input string to the type expected by the schema.
   * The privacy field is backed by a text input (emits strings), but the schema
   * may declare `type: number`/`integer` (e.g. a Firewall ID). Without this,
   * the numeric value fails JSON Schema validation and the field is treated as
   * empty, surfacing a spurious "is a required property" error.
   */
  const parseValue = (rawValue) => {
    const schemaType = control.value.schema.type
    if (schemaType !== 'number' && schemaType !== 'integer') return rawValue

    if (rawValue === '' || rawValue === null || rawValue === undefined) return undefined
    const parsed = Number(rawValue)
    return Number.isNaN(parsed) ? rawValue : parsed
  }

  const onChange = (value) => {
    const parsedValue = parseValue(value)
    handleChange(path.value, parsedValue)
    emit('change', parsedValue)
  }

  const onBlur = (event) => {
    isBlurred.value = true
    const value = parseValue(event.target?.value)
    handleChange(path.value, value)
    // Capture the error at blur time to prevent it from updating during typing
    if (isRequiredAndEmpty.value) {
      blurredError.value = 'Required'
    } else {
      blurredError.value = error.value
    }
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
  <div
    class="flex flex-col gap-2"
    :class="{ '[&_small.p-error]:hidden': errorMessage === 'Required' }"
  >
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
