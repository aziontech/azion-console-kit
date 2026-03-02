<template>
  <EditFormBlock
    :editService="props.editEdgeApplicationService"
    :loadService="loadEdgeApplication"
    :updatedRedirect="props.updatedRedirect"
    :schema="validationSchema"
    :initialValues="props.initialValues"
    @on-edit-success="handleTrackSuccessEdit"
    @on-edit-fail="handleTrackFailEdit"
    disableRedirect
    isTabs
    data-testid="edit-edge-application-form-block"
  >
    <template #form>
      <FormFieldsCreateEdgeApplications
        :handleBlock="handleBlocks"
        :contactSalesEdgeApplicationService="contactSalesEdgeApplicationService"
        data-testid="edit-edge-application-form-fields"
      />
    </template>
    <template #action-bar="{ onSubmit, formValid, onCancel, loading, values }">
      <ActionBarBlockWithTeleport
        @onSubmit="formSubmit(onSubmit, values, formValid)"
        @onCancel="onCancel"
        :loading="loading"
        data-testid="edit-edge-application-action-bar"
      />
    </template>
  </EditFormBlock>
</template>

<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import * as yup from 'yup'
  import FormFieldsCreateEdgeApplications from './FormFields/FormFieldsCreateEdgeApplications'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { inject, ref, watch } from 'vue'

  defineOptions({ name: 'edit-application' })

  const emit = defineEmits(['updatedApplication'])

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const isApplicationLoaded = inject('isApplicationLoaded', ref(true))

  const props = defineProps({
    editEdgeApplicationService: {
      type: Function,
      required: true
    },
    updatedRedirect: {
      type: String,
      required: true
    },
    edgeApplication: { type: Object },
    initialValues: { type: Object, default: () => ({}) },
    contactSalesEdgeApplicationService: {
      type: Function,
      required: true
    }
  })

  const handleBlocks = ['general', 'delivery-settings', 'edge-application-modules', 'debug-rules']

  const validationSchema = yup.object({
    name: yup.string().required(),
    httpPort: yup.array().when('deliveryProtocol', {
      is: (deliveryProtocol) => deliveryProtocol?.includes('http'),
      then: (schema) => schema.min(1).required()
    }),
    httpsPort: yup.array().when('deliveryProtocol', {
      is: (deliveryProtocol) => deliveryProtocol?.includes('https'),
      then: (schema) => schema.min(1).required()
    })
  })

  const loadEdgeApplication = () => {
    if (isApplicationLoaded.value) {
      return props.edgeApplication
    }

    return new Promise((resolve) => {
      const unwatch = watch(isApplicationLoaded, (loaded) => {
        if (loaded) {
          unwatch()
          resolve(props.edgeApplication)
        }
      })
    })
  }

  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Edge Application',
        tab: 'mainSettings'
      })
      .track()
  }
  const handleTrackFailEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Edge Application',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const formSubmit = async (onSubmit, values, formValid) => {
    await onSubmit()
    if (!formValid) return
    emit('updatedApplication', { ...props.edgeApplication, ...values })
  }
</script>
