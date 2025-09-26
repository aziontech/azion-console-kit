<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsKnowledgeBase from './FormFields/FormFieldsKnowledgeBase.vue'
  import * as yup from 'yup'
  import { inject } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    loadKnowledgeBaseService: { type: Function, required: true },
    editKnowledgeBaseService: { type: Function, required: true },
    updatedRedirect: { type: String, required: true }
  })

  const validationSchema = yup.object({
    name: yup.string().required('Name is required'),
    description: yup.string().required('Description is required'),
    category: yup.string().required('Category is required'),
    content: yup.string().required('Content is required')
  })

  const handleTrackEditEvent = () => {
    tracker.product.productEdited({
      productName: 'Knowledge Base'
    })
  }

  const handleTrackFailEditEvent = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Knowledge Base',
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
      <PageHeadingBlock pageTitle="Edit Knowledge Base Item" />
    </template>
    <template #content>
      <EditFormBlock
        :editService="props.editKnowledgeBaseService"
        :loadService="props.loadKnowledgeBaseService"
        :updatedRedirect="updatedRedirect"
        :schema="validationSchema"
        @on-edit-success="handleTrackEditEvent"
        @on-edit-fail="handleTrackFailEditEvent"
      >
        <template #form>
          <FormFieldsKnowledgeBase />
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