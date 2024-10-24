<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Open ID Provider Configuration"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="createNetworkListService"
        @on-response="handleTrackCreation"
        @on-response-fail="handleTrackFailedCreation"
        :schema="validationSchema"
        :initialValues="initialValues"
      >
        <template #form>
          <FormFieldsCreateIdentityProvider />
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

<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import FormFieldsCreateIdentityProvider from './FormFields/FormFieldsCreateIdentityProvider'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import * as yup from 'yup'
  import { inject } from 'vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const initialValues = {
    name: '',
    identityProviderType: 'openid'
  }

  const handleTrackCreation = () => {
    tracker.product.productCreated({
      productName: 'SSO Management'
    })
  }

  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'SSO Management',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    identityProviderType: yup.string().oneOf(['openid', 'saml'])
  })
</script>
