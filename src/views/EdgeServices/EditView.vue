<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormCreateEdgeService from '@/views/EdgeServices/FormFields/FormFieldsEdgeService'
  import * as yup from 'yup'
  import { inject } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { edgeServiceService } from '@/services/v2/edge-service/edge-service-service'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'edit-edge-service' })

  const emit = defineEmits(['handleEdgeServiceUpdated', 'loaded-service-object'])

  const props = defineProps({
    hiddenActionBar: { type: Boolean, default: false },
    updatedRedirect: { type: String, required: true },
    initialValues: { type: Object, default: () => ({}) }
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

  const formSubmit = async (onSubmit, values) => {
    await onSubmit()
    emit('handleEdgeServiceUpdated', values)
  }

  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Edge Service'
      })
      .track()
  }
  const handleTrackFailEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Edge Service',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>

<template>
  <div>
    <EditFormBlock
      :editService="edgeServiceService.editEdgeServiceService"
      :loadService="edgeServiceService.loadEdgeServiceService"
      :updatedRedirect="updatedRedirect"
      :initialValues="props.initialValues"
      :schema="validationSchema"
      :disableRedirect="true"
      :isTabs="true"
      @on-edit-success="handleTrackSuccessEdit"
      @on-edit-fail="handleTrackFailEdit"
      @loaded-service-object="(data) => emit('loaded-service-object', data)"
    >
      <template #form="{ loading }">
        <FormCreateEdgeService :loading="loading" />
      </template>
      <template #action-bar="{ onSubmit, onCancel, loading, values }">
        <ActionBarTemplate
          v-if="props.hiddenActionBar"
          @onSubmit="formSubmit(onSubmit, values)"
          @onCancel="onCancel"
          :loading="loading"
        />
      </template>
    </EditFormBlock>
  </div>
</template>
