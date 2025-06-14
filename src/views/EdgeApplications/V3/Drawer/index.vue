<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import { refDebounced } from '@vueuse/core'
  import * as yup from 'yup'
  import FormFieldsCreateEdgeApplications from '@/views/EdgeApplications/V3/FormFields/FormFieldsCreateEdgeApplications.vue'
  import { ref, inject, defineExpose } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { createEdgeApplicationService } from '@/services/edge-application-services'
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
    name: yup.string().required(),
    address: yup.string().required(),
    hostHeader: yup.string().required(),
    cdnCacheSettingsMaximumTtl: yup.string().required(),
    httpPort: yup.array().when('deliveryProtocol', {
      is: (deliveryProtocol) => deliveryProtocol?.includes('http'),
      then: (schema) => schema.min(1).required()
    }),
    httpsPort: yup.array().when('deliveryProtocol', {
      is: (deliveryProtocol) => deliveryProtocol?.includes('https'),
      then: (schema) => schema.min(1).required()
    })
  })

  const initialValues = ref({
    name: '',
    deliveryProtocol: 'http',
    http3: false,
    httpPort: [{ name: '80 (Default)', value: '80' }],
    httpsPort: [{ name: '443 (Default)', value: '443' }],
    minimumTlsVersion: 'none',
    supportedCiphers: 'all',
    originType: 'single_origin',

    address: '',
    originProtocolPolicy: 'preserve',
    hostHeader: '${host}',
    browserCacheSettings: 'override',
    browserCacheSettingsMaximumTtl: 0,
    cdnCacheSettings: 'override',
    cdnCacheSettingsMaximumTtl: 60,
    debugRules: false
  })

  const handleBlocks = [
    'general',
    'delivery-settings',
    'default-origins',
    'cache-expiration-policies',
    'debug-rules'
  ]

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
    handleToast(response)
    emit('onSuccess')
    emit('onEdgeApplicationCreated', response.id)
    closeCreateDrawer()
  }
  const handleToast = (response) => {
    const toast = {
      feedback: 'Your edge application has been created'
    }
    response.showToastWithActions(toast)
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
    disableToast
  >
    <template #formFields>
      <FormFieldsCreateEdgeApplications
        :handleBlock="handleBlocks"
        data-testid="create-edge-application-form-fields"
      />
    </template>
  </CreateDrawerBlock>
</template>
