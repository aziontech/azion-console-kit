<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import { refDebounced } from '@vueuse/core'
  import { ref, inject, defineExpose, watch, computed } from 'vue'
  import FormFieldsCreateDigitalCertificates from '../FormFields/FormFieldsCreateDigitalCertificates.vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import validationSchemaHandler from '../FormFields/composables/validation'
  import { useDigitalCertificate } from '../FormFields/composables/certificate'

  defineOptions({
    name: 'digital-certificates-drawer'
  })

  const props = defineProps({
    certificate: {
      type: String,
      default: 'edge_certificate'
    },
    isWorkloadCreation: {
      type: Boolean,
      default: false
    }
  })

  const validationSchema = validationSchemaHandler(props.isWorkloadCreation, props.certificate)

  const emit = defineEmits(['onSuccess', 'onEdgeApplicationCreated'])

  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const showCreateDigitalCertificateDrawer = ref(false)
  const DEBOUNCE_TIME_IN_MS = 300
  const showCreateDrawer = refDebounced(showCreateDigitalCertificateDrawer, DEBOUNCE_TIME_IN_MS)

  const { createService, PRIVATE_KEY_TYPES, certificateType } = useDigitalCertificate(
    props.certificate
  )

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
    certificateType: props.certificate
  })

  const handleTrackSuccessCreated = () => {
    tracker.product.productCreated({
      productName: 'Digital Certificate'
    })
  }

  const titleDrawer = computed(() => {
    if (certificateType.value === 'generateCSR') {
      return 'Create Edge Certificate CSR'
    } else if (certificateType.value === 'trusted_ca_certificate') {
      return 'Create Trusted CA Certificate'
    } else if (certificateType.value === 'certificateRevogationList') {
      return 'Create Certificate Revocation List'
    }

    return 'Create Digital Certificate'
  })

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
    emit('onSuccess', {
      type: certificateType.value,
      id: response.data.id,
      authority: response.data.authority
    })
    closeCreateDrawer()
  }

  const handleToast = (response) => {
    const toast = {
      feedback: 'Your digital certificate has been created!'
    }
    response.showToastWithActions(toast)
  }

  watch(
    () => props.certificate,
    (newVal) => {
      initialValues.value.certificateType = newVal
      certificateType.value = newVal
    },
    { immediate: true }
  )

  const changeCertificateType = (certificate) => {
    certificateType.value = certificate
  }

  defineExpose({
    showCreateDrawer,
    openCreateDrawer,
    changeCertificateType
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
    :title="titleDrawer"
    disableToast
  >
    <template #formFields>
      <FormFieldsCreateDigitalCertificates
        isDrawer
        :isWorkloadCreation="isWorkloadCreation"
      />
    </template>
  </CreateDrawerBlock>
</template>
