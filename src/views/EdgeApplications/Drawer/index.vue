<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import { refDebounced } from '@vueuse/core'
  import * as yup from 'yup'
  import FormFieldsCreateEdgeApplications from '@/views/EdgeApplications/FormFields/FormFieldsCreateEdgeApplications'
  import { ref, inject, defineExpose } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { createEdgeApplicationService } from '@/services/edge-application-services/v4'
  import { useRoute } from 'vue-router'

  defineOptions({
    name: 'edge-applications-drawer'
  })
  const emit = defineEmits(['onSuccess', 'onEdgeApplicationCreated'])

  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const route = useRoute()

  const showCreateEdgeApplicationsDrawer = ref(false)
  const DEBOUNCE_TIME_IN_MS = 300
  const showCreateDrawer = refDebounced(showCreateEdgeApplicationsDrawer, DEBOUNCE_TIME_IN_MS)

  const validationSchema = yup.object({
    name: yup.string().required()
  })

  const initialValues = ref({
    name: ''
  })

  const handleBlocks = ['general']

  const handleTrackCreation = () => {
    tracker.product.productCreated({
      productName: 'Edge Application',
      from: route.query.origin,
      createdFrom: 'singleEntity'
    })
  }

  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Edge Application',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const closeCreateDrawer = () => {
    showCreateEdgeApplicationsDrawer.value = false
  }
  const openCreateDrawer = () => {
    showCreateEdgeApplicationsDrawer.value = true
  }
  const handleCreateWithSuccess = (response) => {
    handleTrackCreation()
    emit('onSuccess')
    emit('onEdgeApplicationCreated', response.applicationId)
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
    data-testid="edge-application-drawer"
    v-model:visible="showCreateEdgeApplicationsDrawer"
    :createService="createEdgeApplicationService"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateWithSuccess"
    @onResponseFail="handleTrackFailedCreation"
    title="Create Edge Application"
  >
    <template #formFields>
      <FormFieldsCreateEdgeApplications
        :handleBlock="handleBlocks"
        data-testid="create-edge-application-form-fields"
      />
    </template>
  </CreateDrawerBlock>
</template>
