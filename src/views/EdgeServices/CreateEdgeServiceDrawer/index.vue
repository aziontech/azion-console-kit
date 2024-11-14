<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import { refDebounced } from '@vueuse/core'
  import * as yup from 'yup'
  import { ref, inject, defineExpose } from 'vue'
  import FormFieldsEdgeService from '../FormFields/FormFieldsEdgeService'
  import { createEdgeServiceServices } from '@/services/edge-service-services'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  defineOptions({
    name: 'edge-services-drawer'
  })
  const emit = defineEmits(['onSuccess'])
  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const showCreateEdgeServicesDrawer = ref(false)
  const DEBOUNCE_TIME_IN_MS = 300
  const showCreateDrawer = refDebounced(showCreateEdgeServicesDrawer, DEBOUNCE_TIME_IN_MS)

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

  const closeCreateDrawer = () => {
    showCreateEdgeServicesDrawer.value = false
  }
  const openCreateDrawer = () => {
    showCreateEdgeServicesDrawer.value = true
  }
  const handleCreateWithSuccess = (response) => {
    handleTrackSuccessCreated()
    emit('onSuccess', response.id)
    closeCreateDrawer()
  }
  defineExpose({
    showCreateDrawer,
    openCreateDrawer
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="showCreateDrawer"
    v-model:visible="showCreateEdgeServicesDrawer"
    drawerId="create-edge-service-drawer"
    :createService="createEdgeServiceServices"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateWithSuccess"
    @onResponseFail="handleTrackFailCreated"
    title="Create Edge Service"
  >
    <template #formFields>
      <FormFieldsEdgeService isDrawer />
    </template>
  </CreateDrawerBlock>
</template>
