<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormCreateEdgeService from '@/views/EdgeServices/FormFields/FormFieldsEdgeService'
  import * as yup from 'yup'
  import { inject } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'edit-edge-service' })

  const emit = defineEmits(['handleEdgeServiceUpdated'])

  const props = defineProps({
    hiddenActionBar: { type: Boolean, default: false },
    loadEdgeService: { type: Function, required: true },
    editEdgeService: { type: Function, required: true },
    updatedRedirect: { type: String, required: true }
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
      :editService="props.editEdgeService"
      :loadService="props.loadEdgeService"
      :updatedRedirect="updatedRedirect"
      :schema="validationSchema"
      :disableRedirect="true"
      :isTabs="true"
      @on-edit-success="handleTrackSuccessEdit"
      @on-edit-fail="handleTrackFailEdit"
    >
      <template #form>
        <FormCreateEdgeService />
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
