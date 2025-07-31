<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsEdgeStorage from './FormFields/FormFieldsEdgeStorage.vue'
  import * as yup from 'yup'
  import { inject } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const router = useRouter()
  const toast = useToast()

  defineProps({
    createEdgeStorageBucketService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    name: yup.string().label('Name').required().min(3).max(63),
    edgeAccess: yup.string().label('Edge Access').required().default('read_write')
  })

  const handleResponse = (response) => {
    tracker.product.productCreated({
      productName: 'Edge Storage Bucket'
    })

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Bucket "${response.name}" has been created successfully`,
      life: 5000
    })

    router.push('/edge-storage')
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

  const mockCreateService = async (data) => {
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
