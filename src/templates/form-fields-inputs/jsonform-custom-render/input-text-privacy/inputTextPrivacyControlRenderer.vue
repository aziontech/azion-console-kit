<script setup>
  import { computed, ref, inject, watch } from 'vue'
  import { useJsonFormsControl, rendererProps } from '@jsonforms/vue'
  import fieldInputTextPrivacy from '@/templates/form-fields-inputs/filedInputTextPrivacy.vue'

  const emit = defineEmits(['change', 'blur'])
  const props = defineProps(rendererProps())

  const { control, handleChange } = useJsonFormsControl(props)
  const isChanged = ref(false)
  const isPublic = ref(true)

  // Inject the function to update privacy field state
  const updatePrivacyFieldState = inject('updatePrivacyFieldState', () => {})

  const description = computed(() => control.value.description)
  const label = computed(() => control.value.schema.label)
  const path = computed(() => control.value.path)
  const required = computed(() => control.value.required)
  const error = computed(() => (control.value.errors ? control.value.schema.error : ''))
  const errorMessage = computed(() => (!error.value || !isChanged.value ? '' : error.value))
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
