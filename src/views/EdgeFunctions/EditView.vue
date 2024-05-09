<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Edge Function">
        <MobileCodePreview
          :updateObject="updateObject"
          :language="language"
        />
      </PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="props.editEdgeFunctionsService"
        :loadService="props.loadEdgeFunctionsService"
        :updatedRedirect="props.updatedRedirect"
        :schema="validationSchema"
      >
        <template #form>
          <FormFieldsEditEdgeFunctions
            v-model:preview-data="updateObject"
            v-model:lang="language"
          />
        </template>
        <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
          <ActionBarBlockWithTeleport
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
            :submitDisabled="!formValid"
          />
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import * as yup from 'yup'
  import ContentBlock from '@/templates/content-block'
  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsEditEdgeFunctions from './FormFields/FormFieldsEditEdgeFunctions.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import MobileCodePreview from './components/mobile-code-preview.vue'
  import { ref } from 'vue'

  const props = defineProps({
    loadEdgeFunctionsService: {
      type: Function,
      required: true
    },
    editEdgeFunctionsService: {
      type: Function,
      required: true
    },
    updatedRedirect: {
      type: String,
      required: true
    }
  })
  const updateObject = ref({})
  const language = ref(null)

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    code: yup.string().required('Code is a required field'),
    jsonArgs: yup.string().test('validJson', 'Invalid JSON', (value) => {
      let isValidJson = true
      try {
        JSON.parse(value)
      } catch {
        isValidJson = false
      }
      return isValidJson
    }),
    active: yup.boolean(),
    language: yup.string()
  })
</script>
