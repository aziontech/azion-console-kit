<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsVariables from './FormFields/FormFieldsVariables.vue'
  import * as yup from 'yup'
  import { inject } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    loadVariableService: { type: Function, required: true },
    editVariableService: { type: Function, required: true },
    updatedRedirect: { type: String, required: true }
  })

  const keyRegex = /^[A-Z0-9_]*$/

  const validationSchema = yup.object({
    key: yup
      .string()
      .test('key', 'Invalid key format', (value) => keyRegex.test(value))
      .required(),
    value: yup.string().required(),
    secret: yup.boolean().required().default(false)
  })

  const handleTrackEditEvent = () => {
    tracker.product.productEdited({
      productName: 'Variable'
    })
  }

  const handleTrackFailEditEvent = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Variable',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>
<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Variable" />
    </template>
    <template #content>
      <EditFormBlock
        :editService="props.editVariableService"
        :loadService="props.loadVariableService"
        :updatedRedirect="updatedRedirect"
        :schema="validationSchema"
        @on-edit-success="handleTrackEditEvent"
        @on-edit-fail="handleTrackFailEditEvent"
      >
        <template #form>
          <FormFieldsVariables />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>
