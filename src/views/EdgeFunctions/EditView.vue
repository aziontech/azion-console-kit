<script setup>
  import * as yup from 'yup'
  import ContentBlock from '@/templates/content-block'
  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsEditEdgeFunctions from './FormFields/FormFieldsEditEdgeFunctions.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import MobileCodePreview from './components/mobile-code-preview.vue'
  import { ref, inject } from 'vue'
  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  import { edgeFunctionService } from '@/services/v2'

  const props = defineProps({
    updatedRedirect: {
      type: String,
      required: true
    }
  })
  const updateObject = ref({})
  const language = ref(null)
  const name = ref('')

  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Edge Functions'
      })
      .track()
  }
  const handleTrackFailEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Edge Functions',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    code: yup.string().required('Code is a required field'),
    defaultArgs: yup.string().test('validJson', 'Invalid JSON', (value) => {
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

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock :pageTitle="name">
        <MobileCodePreview
          :updateObject="updateObject"
          :language="language"
        />
      </PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="edgeFunctionService.editEdgeFunctionService"
        :loadService="edgeFunctionService.loadEdgeFunctionService"
        :updatedRedirect="props.updatedRedirect"
        @on-edit-success="handleTrackSuccessEdit"
        @on-edit-fail="handleTrackFailEdit"
        :schema="validationSchema"
      >
        <template #form>
          <FormFieldsEditEdgeFunctions
            v-model:preview-data="updateObject"
            v-model:lang="language"
            v-model:name="name"
          />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarBlockWithTeleport
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>
