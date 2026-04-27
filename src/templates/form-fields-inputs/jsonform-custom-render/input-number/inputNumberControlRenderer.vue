<script setup>
  import { computed, ref } from 'vue'
  import { useJsonFormsControl, rendererProps } from '@jsonforms/vue'
  import fieldNumber from '@aziontech/webkit/field-number'

  const emit = defineEmits(['change', 'blur'])
  const props = defineProps(rendererProps())

  const { control, handleChange } = useJsonFormsControl(props)
  const isChanged = ref(false)
  const description = computed(() => control.value.description)
  const label = computed(() => control.value.schema.label)
  const path = computed(() => control.value.path)
  const required = computed(() => control.value.required)
  const error = computed(() => (control.value.errors ? control.value.schema.error : ''))
  const errorMessage = computed(() => (!error.value || !isChanged.value ? '' : error.value))
  const min = computed(() => control.value.schema.minimum)
  const max = computed(() => control.value.schema.maximum)
  const step = computed(() => control.value.schema.multipleOf || 1)
  const showButtons = computed(() => control.value.schema.showButtons ?? true)
  const useGrouping = computed(() => (control.value.schema.type === 'number' ? true : false))
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
