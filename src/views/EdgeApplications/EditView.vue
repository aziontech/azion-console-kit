<template>
  <EditFormBlock
    :editService="props.editEdgeApplicationService"
    :loadService="loadEdgeApplication"
    :updatedRedirect="props.updatedRedirect"
    :schema="validationSchema"
    @on-edit-success="handleTrackSuccessEdit"
    @on-edit-fail="handleTrackFailEdit"
    disableRedirect
    :isTabs="true"
  >
    <template #form>
      <FormFieldsCreateEdgeApplications
        :handleBlock="handleBlocks"
        :contactSalesEdgeApplicationService="contactSalesEdgeApplicationService"
      />
    </template>
    <template #action-bar="{ onSubmit, formValid, onCancel, loading, values }">
      <ActionBarBlockWithTeleport
        @onSubmit="formSubmit(onSubmit, values)"
        @onCancel="onCancel"
        :loading="loading"
        :submitDisabled="!formValid"
      />
    </template>
  </EditFormBlock>
</template>

<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import * as yup from 'yup'
  import FormFieldsCreateEdgeApplications from './FormFields/FormFieldsCreateEdgeApplications'
  import { inject } from 'vue'

  defineOptions({ name: 'edit-edge-application' })
  const emit = defineEmits(['updatedApplication'])
  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  const tracker = inject('tracker')

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
    contactSalesEdgeApplicationService: {
      type: Function,
      required: true
    }
  })

  const handleBlocks = ['general', 'delivery-settings', 'edge-application-modules', 'debug-rules']

  const validationSchema = yup.object({
    name: yup.string().required()
  })

  const loadEdgeApplication = async () => {
    return props.edgeApplication
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

  const formSubmit = async (onSubmit, values) => {
    await onSubmit()
    emit('updatedApplication', values)
  }
</script>
