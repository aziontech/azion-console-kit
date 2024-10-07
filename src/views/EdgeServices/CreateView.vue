<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsEdgeService from './FormFields/FormFieldsEdgeService'
  import * as yup from 'yup'
  import { inject } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'create-edge-service' })

  const props = defineProps({
    createEdgeServiceServices: {
      type: Function,
      required: true
    }
  })

  const validateCode = (val = '') => {
    const split = val.split(/\s*\n+\s*/).filter((row) => !!row)
    const isValid = split.every((row) => /^\w+\s*=[^]+$/.test(row))
    return isValid
  }

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    active: yup.boolean(),
    code: yup.string().test('formatInvalid', 'The format is invalid', validateCode)
  })

  const initialValues = {
    name: '',
    code: '',
    active: true
  }

  const handleTrackSuccessCreated = () => {
    tracker.product.productCreated({
      productName: 'Edge Service'
    })
  }

  const handleTrackFailCreated = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Edge Service',
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
      <PageHeadingBlock pageTitle="Create Edge Service"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createEdgeServiceServices"
        :schema="validationSchema"
        :initialValues="initialValues"
        @on-response="handleTrackSuccessCreated"
        @on-response-fail="handleTrackFailCreated"
      >
        <template #form>
          <FormFieldsEdgeService />
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
