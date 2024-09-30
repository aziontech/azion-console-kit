<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsVariables from './FormFields/FormFieldsVariables.vue'
  import * as yup from 'yup'
  import { inject } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    createVariablesService: {
      type: Function,
      required: true
    }
  })

  const keyRegex = /^[A-Z0-9_]*$/

  const validationSchema = yup.object({
    key: yup
      .string()
      .test('key', 'Invalid key format', (value) => keyRegex.test(value))
      .required(),
    value: yup.string().required(),
    secret: yup.boolean().required().default(false)
  })

  const handleResponse = () => {
    tracker.product.productCreated({
      productName: 'Variable'
    })
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
      <PageHeadingBlock pageTitle="Create Variables" />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createVariablesService"
        :schema="validationSchema"
        @on-response="handleResponse"
        @on-response-fail="handleTrackFailedCreation"
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
