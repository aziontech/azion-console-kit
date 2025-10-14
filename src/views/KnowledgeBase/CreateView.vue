<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
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
    createKnowledgeBaseService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    name: yup
      .string()
      .required('Name is required')
      .min(6, 'Name must be at least 6 characters')
      .max(50, 'Name must be at most 50 characters')
      .matches(/^[a-zA-Z0-9-]+$/, 'Use only letters, numbers and hyphen (-)'),
    description: yup.string().required('Description is required'),
    embedding_model: yup.string()
  })

  const handleResponse = (response) => {
    tracker.product.productCreated({
      productName: 'Knowledge Base'
    })
    handleToast(response)
  }

  const handleToast = (response) => {
    const toast = {
      feedback: 'Your knowledge base item has been created',
      actions: {
        link: {
          label: 'View Knowledge Base List', 
          callback: () => response.redirectToUrl('/ai/knowledge-base')
        }
      }
    }
    response.showToastWithActions(toast)
  }

  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
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
      <PageHeadingBlock pageTitle="Create Knowledge Base" />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="createKnowledgeBaseService"
        :schema="validationSchema"
        :initialValues="{ embedding_model: 'text-embedding-3-small' }"
        @on-response="handleResponse"
        @on-response-fail="handleTrackFailedCreation"
        disableToast
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
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>