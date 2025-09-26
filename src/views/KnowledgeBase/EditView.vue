<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsKnowledgeBase from './FormFields/FormFieldsKnowledgeBase.vue'
  import * as yup from 'yup'
  import { inject, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const formFieldsRef = ref(null)

  const props = defineProps({
    loadKnowledgeBaseService: { type: Function, required: true },
    editKnowledgeBaseService: { type: Function, required: true },
    updatedRedirect: { type: String, required: true }
  })

  const validationSchema = yup.object({
    name: yup.string(), // Read-only, no validation needed
    description: yup.string().required('Description is required'),
    embedding_model: yup.string() // Read-only, no validation needed
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

  // Debug loaded data
  const handleLoadedData = (data) => {
    console.log('📤 EditView: Loaded data from service:', data)
    console.log('📤 EditView: Data type:', typeof data)
    console.log('📤 EditView: Data keys:', data ? Object.keys(data) : 'NO KEYS')
    console.log('📤 EditView: Data values:')
    if (data) {
      console.log('  - id:', data.id)
      console.log('  - name:', data.name)
      console.log('  - description:', data.description)
      console.log('  - embedding_model:', data.embedding_model)
    }

    // Debug form fields after data load - add a slight delay to see if form is updated
    setTimeout(() => {
      console.log('📤 EditView: Checking form field values after 100ms delay...')
      const nameField = document.querySelector('[data-testid="knowledge-base-form__name-field"] input')
      const descField = document.querySelector('[data-testid="knowledge-base-form__description-field"] textarea')
      const embedField = document.querySelector('[data-testid="knowledge-base-form__embedding-model-field"] input')

      console.log('📤 EditView: DOM field values:')
      console.log('  - name field value:', nameField?.value || 'NOT FOUND')
      console.log('  - description field value:', descField?.value || 'NOT FOUND')
      console.log('  - embedding field value:', embedField?.value || 'NOT FOUND')
    }, 100)

    setTimeout(() => {
      console.log('📤 EditView: Checking form field values after 500ms delay...')
      const nameField = document.querySelector('[data-testid="knowledge-base-form__name-field"] input')
      const descField = document.querySelector('[data-testid="knowledge-base-form__description-field"] textarea')
      const embedField = document.querySelector('[data-testid="knowledge-base-form__embedding-model-field"] input')

      console.log('📤 EditView: DOM field values:')
      console.log('  - name field value:', nameField?.value || 'NOT FOUND')
      console.log('  - description field value:', descField?.value || 'NOT FOUND')
      console.log('  - embedding field value:', embedField?.value || 'NOT FOUND')

      // Try manual form field update
      if (formFieldsRef.value?.handleExternalDataUpdate) {
        console.log('📤 EditView: Calling manual form field update')
        formFieldsRef.value.handleExternalDataUpdate(data)
      }
    }, 500)
  }

  // Manual test function for debugging
  const route = useRoute()
  const testLoadService = async () => {
    try {
      console.log('🧪 Testing load service manually...')
      const { id } = route.params
      console.log('🧪 Using ID from route:', id)

      const result = await props.loadKnowledgeBaseService({ id })
      console.log('🧪 Manual load service result:', result)
    } catch (error) {
      console.error('🧪 Manual load service error:', error)
    }
  }
</script>
<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Knowledge Base" />
    </template>
    <template #content>
      <EditFormBlock
        :editService="props.editKnowledgeBaseService"
        :loadService="props.loadKnowledgeBaseService"
        :updatedRedirect="updatedRedirect"
        :schema="validationSchema"
        @on-edit-success="handleTrackEditEvent"
        @on-edit-fail="handleTrackFailEditEvent"
        @loaded-service-object="handleLoadedData"
      >
        <template #form>
          <FormFieldsKnowledgeBase ref="formFieldsRef" :isEditMode="true" />
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