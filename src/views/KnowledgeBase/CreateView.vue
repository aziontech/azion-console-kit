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

  // Debug wrapper for the create service
  const debugCreateKnowledgeBaseService = async (payload) => {
    console.log('🎯 CreateView: About to call createKnowledgeBaseService with payload:', payload)
    console.log('  Service function:', props.createKnowledgeBaseService)

    try {
      const result = await props.createKnowledgeBaseService(payload)
      console.log('✅ CreateView: Service call succeeded with result:', result)
      return result
    } catch (error) {
      console.error('❌ CreateView: Service call failed with error:', error)
      throw error
    }
  }

  const validationSchema = yup.object({
    name: yup.string().required('Name is required'),
    description: yup.string().required('Description is required'),
    embedding_model: yup.string()
  })

  const handleResponse = (response) => {
    console.log('📥 CreateView.handleResponse called with:', response)
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
    console.error('❌ CreateView.handleTrackFailedCreation called with error:', error)
    console.error('  Error type:', typeof error)
    console.error('  Error message:', error?.message)
    console.error('  Error stack:', error?.stack)

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
        :createService="debugCreateKnowledgeBaseService"
        :schema="validationSchema"
        :initialValues="{ embedding_model: 'Qwen/Qwen3-Embedding-4B' }"
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