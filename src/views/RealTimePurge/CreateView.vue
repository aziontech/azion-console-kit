<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import InlineMessage from 'primevue/inlinemessage'
  import FormFieldsCreateRealTimePurge from './FormFields/FormFieldsCreateRealTimePurge'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import * as yup from 'yup'
  import { ref, inject } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { purgeService } from '@/services/v2/purge/purge-service'
  import { usePurgeStore } from '@/stores/purge'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const purgeStore = usePurgeStore()

  defineProps({
    contactSalesRealTimePurgeService: {
      type: Function,
      required: true
    }
  })

  const handleResponse = () => {
    purgeStore.incrementPurgeCount()
    tracker.product.productCreated({
      productName: 'Purge'
    })
  }

  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Purge',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const validationSchema = yup.object({
    layer: yup.string().required(),
    purgeType: yup.string().required(),
    argumentsPurge: yup.string().required('Arguments is a required field')
  })

  const initialValues = ref({
    layer: 'edge_cache',
    purgeType: 'cachekey',
    argumentsPurge: ''
  })
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Real-Time Purge"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="purgeService.createPurge"
        :schema="validationSchema"
        @on-response="handleResponse"
        @on-response-fail="handleTrackFailedCreation"
        :initialValues="initialValues"
      >
        <template #form>
          <InlineMessage
            class="w-fit"
            severity="info"
          >
            After a purge is added, the results may take some time to propagate to all edge nodes.
          </InlineMessage>
          <FormFieldsCreateRealTimePurge
            :contactSalesRealTimePurgeService="contactSalesRealTimePurgeService"
          />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarBlockWithTeleport
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>
