<script setup>
  import { computed, ref } from 'vue'
  import { useJsonFormsControl, rendererProps } from '@jsonforms/vue'
  import fieldInputTextPrivacy from '@/templates/form-fields-inputs/filedInputTextPrivacy.vue'

  const emit = defineEmits(['change', 'blur'])
  const props = defineProps(rendererProps())

  const { control, handleChange } = useJsonFormsControl(props)
  const isChanged = ref(false)
  const isPublic = ref(true)

  const description = computed(() => control.value.description)
  const label = computed(() => control.value.schema.label)
  const path = computed(() => control.value.path)
  const required = computed(() => control.value.required)
  const error = computed(() => (control.value.errors ? control.value.schema.error : ''))
  const errorMessage = computed(() => (!error.value || !isChanged.value ? '' : error.value))

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
  }
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
      @blur="onBlur"
      @input="onChange"
      @update:isPublic="onUpdateIsPublic"
    />
  </div>
</template>
