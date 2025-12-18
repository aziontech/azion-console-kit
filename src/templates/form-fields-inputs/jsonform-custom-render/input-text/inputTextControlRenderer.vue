<script setup>
  import { computed } from 'vue'
  import { useJsonFormsControl, rendererProps } from '@jsonforms/vue'
  import fieldText from '@/templates/form-fields-inputs/fieldText.vue'

  const emit = defineEmits(['change'])

  const props = defineProps(rendererProps())
  const { control, handleChange } = useJsonFormsControl(props)

  const placeholder = computed(() => control.value.schema.placeholder)
  const required = computed(() => control.value.required)
  const data = computed(() => control.value.data)
  const description = computed(() => control.value.description)
  // const errors = computed(() => [control.value.errors])
  const label = computed(() => control.value.label)
  const path = computed(() => control.value.path)

  const onChange = (value) => {
    handleChange(path.value, value)
    emit('change', value)
  }

  // onMounted(() => {
  //   console.log(control.value)
  //   console.log('errors', errors.value)
  // })
</script>

<template>
  <div class="flex flex-col gap-2">
    <fieldText
      v-bind="props"
      :placeholder="placeholder"
      :name="path"
      :label="label"
      :description="description"
      :value="data"
      :required="required"
      @input="onChange"
    />
  </div>
</template>