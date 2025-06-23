<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import { refDebounced } from '@vueuse/core'
  import { ref, inject, defineExpose } from 'vue'
  import FormFieldsCreateDigitalCertificates from '../FormFields/FormFieldsCreateDigitalCertificates.vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { validationSchema } from '../FormFields/composables/validation'
  import { useDigitalCertificate } from '../FormFields/composables/certificate'

  defineOptions({
    name: 'digital-certificates-drawer'
  })
  const emit = defineEmits(['onSuccess', 'onEdgeApplicationCreated'])
  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const showCreateDigitalCertificateDrawer = ref(false)
  const DEBOUNCE_TIME_IN_MS = 300
  const showCreateDrawer = refDebounced(showCreateDigitalCertificateDrawer, DEBOUNCE_TIME_IN_MS)

  const { createService, PRIVATE_KEY_TYPES, CERTIFICATE_TYPES } = useDigitalCertificate()

  const initialValues = ref({
    digitalCertificateName: '',
    certificate: '',
    privateKey: undefined,
    common: '',
    country: '',
    state: '',
    city: '',
    organization: '',
    organizationUnity: '',
    email: '',
    privateKeyType: PRIVATE_KEY_TYPES.RSA_2048,
    subjectAlternativeNames: '',
    certificateType: CERTIFICATE_TYPES.EDGE_CERTIFICATE
  })

  const handleTrackSuccessCreated = () => {
    tracker.product.productCreated({
      productName: 'Digital Certificate'
    })
  }

  const handleTrackFailedToCreate = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Digital Certificate',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const closeCreateDrawer = () => {
    showCreateDigitalCertificateDrawer.value = false
  }
  const openCreateDrawer = () => {
    showCreateDigitalCertificateDrawer.value = true
  }
  const handleCreateWithSuccess = (response) => {
    handleTrackSuccessCreated()
    handleToast(response)
    emit('onSuccess', response.data.id)
    closeCreateDrawer()
  }

  const handleToast = (response) => {
    const toast = {
      feedback: 'Your digital certificate has been created!'
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
    v-model:visible="showCreateDigitalCertificateDrawer"
    :createService="createService"
    :schema="validationSchema"
    drawerId="digital-certificates-drawer"
    :initialValues="initialValues"
    @onSuccess="handleCreateWithSuccess"
    @onResponseFail="handleTrackFailedToCreate"
    title="Create Digital Certificate"
    disableToast
  >
    <template #formFields>
      <FormFieldsCreateDigitalCertificates isDrawer />
    </template>
  </CreateDrawerBlock>
</template>
