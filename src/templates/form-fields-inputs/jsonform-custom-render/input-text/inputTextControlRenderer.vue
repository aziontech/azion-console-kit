<script setup>
  import { computed } from 'vue'
  import { useJsonFormsControl, rendererProps } from '@jsonforms/vue'
  import fieldText from '@/templates/form-fields-inputs/fieldText.vue'

  const props = defineProps(rendererProps())
  const { control, handleChange } = useJsonFormsControl(props)

  const data = computed(() => control.value.data)
  const description = computed(() => control.value.description)
  // const errors = computed(() => [control.value.errors])
  const label = computed(() => control.value.label)
  const path = computed(() => control.value.path)

  const onChange = (value) => {
    handleChange(path.value, value)
  }
</script>

<template>
  <fieldText
    v-bind="props"
    :name="path"
    :label="label"
    :description="description"
    :value="data"
    @change="onChange"
  />
</template>
