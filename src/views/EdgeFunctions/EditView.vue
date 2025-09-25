<script setup>
  import { ref, inject } from 'vue'
  import * as yup from 'yup'

  import ContentBlock from '@/templates/content-block'
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import PageHeadingBlock from '@/templates/page-heading-block'

  import FormFieldsEditEdgeFunctions from './FormFields/FormFieldsEditEdgeFunctions.vue'
  import MobileCodePreview from './components/mobile-code-preview.vue'

  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  import { edgeFunctionService } from '@/services/v2/edge-function/edge-function-service'

  const props = defineProps({
    updatedRedirect: {
      type: String,
      required: true
    }
  })

  const isLoading = ref(false)
  const additionalErrors = ref([])
  const updateObject = ref({})
  const runtime = ref(null)
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
    azionForm: yup.object(),
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
    runtime: yup.string()
  })

  const hasAdditionalErrors = () => {
    return additionalErrors.value.length
  }

  const handleAdditionalErrors = (errors) => {
    additionalErrors.value = errors
  }

  const formSubmit = async (onSubmit) => {
    isLoading.value = true

    if (hasAdditionalErrors()) {
      isLoading.value = false
      return
    }

    await onSubmit()
    isLoading.value = false
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock :pageTitle="name">
        <MobileCodePreview
          :updateObject="updateObject"
          :runtime="runtime"
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
            v-model:run="runtime"
            v-model:name="name"
            @additionalErrors="handleAdditionalErrors"
          />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarBlockWithTeleport
            @onSubmit="formSubmit(onSubmit)"
            @onCancel="onCancel"
            :loading="isLoading || loading"
          />
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>
