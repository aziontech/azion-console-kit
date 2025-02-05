<template>
  <EditFormBlock
    :editService="props.editEdgeApplicationService"
    :loadService="loadEdgeApplication"
    :updatedRedirect="props.updatedRedirect"
    :schema="validationSchema"
    @on-edit-success="[handleTrackSuccessEdit, updatedStatusUnSaved]"
    @on-edit-fail="handleTrackFailEdit"
    isTabs
    data-testid="edit-edge-application-form-block"
  >
    <template #form>
      <FormFieldsEditEdgeApplications
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
  import FormFieldsEditEdgeApplications from './FormFields/FormFieldsEditEdgeApplications.vue'
  import { inject } from 'vue'

  defineOptions({ name: 'edit-edge-application' })
  const emit = defineEmits(['updatedApplication'])
  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  const tracker = inject('tracker')
  const unsavedStatus = inject('unsaved')

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

  const updatedStatusUnSaved = () => {
    unsavedStatus.formHasUpdated = false
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
    emit('updatedApplication', values)
  }
</script>
