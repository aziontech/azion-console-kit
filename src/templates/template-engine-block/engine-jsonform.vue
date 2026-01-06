<script setup>
  import { ref, markRaw } from 'vue'
  import { JsonForms } from '@jsonforms/vue'
  import { vanillaRenderers } from '@jsonforms/vue-vanilla'
  import FormHorizontal from '@templates/create-form-block/form-horizontal'
  import InputTextControlRenderer from '@templates/form-fields-inputs/jsonform-custom-render/input-text/inputTextControlRenderer.vue'
  import { InputTextControlTester } from '@templates/form-fields-inputs/jsonform-custom-render/input-text/inputTextControlTester'

  defineProps({
    schema: {
      type: Object,
      required: true
    },
    isDrawer: {
      type: Boolean,
      default: false
    }
  })

  const data = ref({})
  const customRenderers = [
    {
      tester: InputTextControlTester,
      renderer: InputTextControlRenderer
    }
  ]
  const renderers = markRaw([...vanillaRenderers, ...customRenderers])

  const onChangeAzionForm = (event) => {
    data.value = event.data
  }
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
            :data="data"
            :schema="schema"
            :renderers="renderers"
            @change="onChangeAzionForm"
          />
        </div>
      </template>
    </FormHorizontal>
  </div>
</template>
