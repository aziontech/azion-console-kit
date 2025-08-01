<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsEdgeStorage from './FormFields/FormFieldsEdgeStorage.vue'
  import * as yup from 'yup'
  import { inject, computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const router = useRouter()
  const route = useRoute()
  const toast = useToast()
  const { addBucket } = useEdgeStorage()

  defineProps({
    createEdgeStorageBucketService: {
      type: Function,
      required: true
    }
  })

  const isCreatePage = computed(() => route.name === 'edge-storage-create')

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

  const mockCreateService = (data) => {
    const newBucket = {
      id: Date.now(),
      name: data.name,
      region: 'us-east-1',
      createdAt: new Date(),
      size: '0 B',
      objectCount: 0,
      data: data.edgeAccess
    }
    addBucket(newBucket)
    return newBucket
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock :pageTitle="isCreatePage ? 'Create Bucket' : 'Edit Bucket'" />
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
          <FormFieldsEdgeStorage :showDangerZone="!isCreatePage" />
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
