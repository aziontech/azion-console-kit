<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsEdgeStorage from './FormFields/FormFieldsEdgeStorage.vue'
  import { useEdgeStorageBuckets } from '@/composables/useEdgeStorageBuckets'
  import * as yup from 'yup'
  import { inject } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const router = useRouter()
  const toast = useToast()
  const { addBucket } = useEdgeStorageBuckets()

  defineProps({
    createEdgeStorageBucketService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    name: yup
      .string()
      .required('Name is required')
      .min(3, 'Name must be at least 3 characters')
      .max(63, 'Name must not exceed 63 characters'),
    edgeAccess: yup.string().required('Edge Access is required').default('read_write')
  })

  const handleResponse = (response) => {
    // Add bucket to shared state
    const newBucket = addBucket(response)

    tracker.product.productCreated({
      productName: 'Edge Storage Bucket'
    })

    // Show success toast
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Bucket "${newBucket.name}" has been created successfully`,
      life: 5000
    })

    // Redirect to list view
    setTimeout(() => {
      router.push('/edge-storage')
    }, 1000)
  }

  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Edge Storage Bucket',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  // Mock service function
  const mockCreateService = async (data) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock validation
    if (!data.name) {
      throw new Error('Name is required')
    }

    return {
      ...data,
      id: Date.now(),
      active: true,
      storageSpace: 0,
      lastModified: new Date().toISOString(),
      lastEditor: 'Current User',
      productVersion: '1.0'
    }
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Bucket" />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="mockCreateService"
        :schema="validationSchema"
        @on-response="handleResponse"
        @on-response-fail="handleTrackFailedCreation"
        disableToast
      >
        <template #form>
          <FormFieldsEdgeStorage />
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
