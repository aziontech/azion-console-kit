<script setup>
  import { computed, ref } from 'vue'
  import { useJsonFormsControl, rendererProps } from '@jsonforms/vue'
  import fieldDropdown from '@aziontech/webkit/field-dropdown'

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
