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
    args: yup.string().test('validJson', 'Invalid JSON', (value) => {
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
        :editService="props.editEdgeFunctionsService"
        :loadService="props.loadEdgeFunctionsService"
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
