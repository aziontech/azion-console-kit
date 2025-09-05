<template>
  <ContentBlock data-testid="create-edge-application-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="Create Application"
        data-testid="create-edge-application-heading"
      />
    </template>
    <template #content>
      <CreateFormBlock
        @on-response="handleResponse"
        @on-response-fail="handleTrackFailedCreation"
        :createService="edgeAppService.createEdgeApplicationService"
        :schema="validationSchema"
        :initialValues="initialValues"
        data-testid="create-edge-application-form-block"
        disableToast
      >
        <template #form>
          <FormFieldsCreateEdgeApplications
            :handleBlock="handleBlocks"
            data-testid="create-edge-application-form-fields"
          />
        </template>

        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarBlockWithTeleport
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
            data-testid="create-edge-application-action-bar"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import { inject, ref } from 'vue'
  import * as yup from 'yup'
  import FormFieldsCreateEdgeApplications from './FormFields/FormFieldsCreateEdgeApplications'

  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { edgeAppService } from '@/services/v2'

  const tracker = inject('tracker')
  import { useRoute } from 'vue-router'
  const route = useRoute()

  const validationSchema = yup.object({
    name: yup.string().required()
  })

  const initialValues = ref({
    name: '',
    applicationAcceleratorEnabled: false,
    edgeCacheEnabled: true,
    edgeFunctionsEnabled: true,
    imageProcessorEnabled: false,
    tieredCacheEnabled: false,
    isActive: true
  })

  const handleBlocks = ['general']

  const handleResponse = (response) => {
    handleTrackCreation()
    handleToast(response)
  }

  const handleToast = ({ data, showToastWithActions, redirectToUrl }) => {
    const toast = {
      feedback: 'Your Application has been created',
      actions: {
        link: {
          label: 'View Application',
          callback: () => redirectToUrl(`/edge-applications/edit/${data.id}`)
        }
      }
    }

    showToastWithActions(toast)
  }

  const handleTrackCreation = () => {
    tracker.product.productCreated({
      productName: 'Application',
      from: route.query.origin,
      createdFrom: 'singleEntity'
    })
  }

  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Application',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>
