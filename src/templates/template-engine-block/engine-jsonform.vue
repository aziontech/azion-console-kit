<script setup>
  import { ref, markRaw } from 'vue'
  import { JsonForms } from '@jsonforms/vue'
  import { vanillaRenderers } from '@jsonforms/vue-vanilla'
  import FormHorizontal from '@templates/create-form-block/form-horizontal'
  import InputTextControlRenderer from '@templates/form-fields-inputs/jsonform-custom-render/input-text/inputTextControlRenderer.vue'
  import { InputTextControlTester } from '@templates/form-fields-inputs/jsonform-custom-render/input-text/inputTextControlTester'

  const props = defineProps({
    schema: {
      type: Object,
      required: true
    },
    isDrawer: {
      type: Boolean,
      default: false
    }
  })

  let isValid = false
  const formData = ref({})
  const errors = ref([])
  const customRenderers = [
    {
      tester: InputTextControlTester,
      renderer: InputTextControlRenderer
    }
  ]
  const renderers = markRaw([...vanillaRenderers, ...customRenderers])

  const onChangeAzionForm = (event) => {
    formData.value = event.data
    errors.value = event.errors
  }

  const validateForm = () => {
    isValid = errors.value.length === 0
    return isValid
  }

  const getFormData = () => {
    const data = []
    const keys = Object.keys(formData.value)

    keys.forEach((key) => {
      const field = props.schema.properties[key]
      
      data.push(
        parseData({
          name: key,
          value: formData.value[key],
          instantiationDataPath: field.instantiation_data_path
        })
      )
    })

    return data
  }

  const parseData = (field) => {
   return {
      field: field.name,
      value: field.value,
      instantiation_data_path: field.instantiationDataPath
    } 
  }

  defineExpose({ validateForm, getFormData })
</script>

<template>
  <div class="w-full grow flex flex-col gap-8 max-md:gap-6">
    <FormHorizontal
      :title="schema.title"
      :isDrawer="false"
    >
      <template #inputs>
        <div class="sm:max-w-lg">
          <JsonForms
            :data="formData"
            :schema="schema"
            :renderers="renderers"
            @change="onChangeAzionForm"
          />
        </div>
      </template>
    </FormHorizontal>
  </div>
</template>
