<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsVariables from '../FormFields/FormFieldsVariables.vue'
  import { scopeArraySchema } from '../FormFields/scope-schema'
  import * as yup from 'yup'
  import { inject } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { variablesV6Service } from '@/services/v2/variables/v6/variables-v6-service'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const keyRegex = /^[A-Z0-9_]*$/

  const validationSchema = yup.object({
    key: yup
      .string()
      .test('key', 'Invalid key format', (value) => keyRegex.test(value))
      .required(),
    value: yup.string().required(),
    secret: yup.boolean().required().default(false),
    scope: scopeArraySchema
  })

  const initialValues = { scope: [{ type: 'global', resourceType: '', id: '' }] }

  const handleResponse = (response) => {
    tracker.product.productCreated({
      productName: 'Variable'
    })
    handleToast(response)
  }

  const handleToast = (response) => {
    const toast = {
      feedback: 'Your variable has been created',
      actions: {}
    }

    if (response?.secret) {
      response.showToastWithActions(toast)
      response.redirectToUrl('/variables')
      return
    }

    toast.actions = {
      link: {
        label: 'View Variables',
        callback: () => response.redirectToUrl(`/variables/edit/${response.id}`)
      }
    }
    response.showToastWithActions(toast)
  }

  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Variable',
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
      <PageHeadingBlock
        pageTitle="Create Variables"
        description="Configure variable names, values, and settings for use across Azion’s products."
      />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="variablesV6Service.create"
        :schema="validationSchema"
        :initialValues="initialValues"
        @on-response="handleResponse"
        @on-response-fail="handleTrackFailedCreation"
        disableToast
      >
        <template #form>
          <FormFieldsVariables />
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
