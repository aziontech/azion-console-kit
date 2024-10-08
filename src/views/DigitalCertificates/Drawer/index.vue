<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import { refDebounced } from '@vueuse/core'
  import * as yup from 'yup'
  import { ref, inject, defineExpose, watch } from 'vue'
  import {
    createDigitalCertificatesService,
    createDigitalCertificatesCSRService
  } from '@/services/digital-certificates-services'
  import FormFieldsCreateDigitalCertificates from '../FormFields/FormFieldsCreateDigitalCertificates.vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  defineOptions({
    name: 'digital-certificates-drawer'
  })
  const emit = defineEmits(['onSuccess', 'onEdgeApplicationCreated'])
  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const showCreateDigitalCertificateDrawer = ref(false)
  const DEBOUNCE_TIME_IN_MS = 300
  const showCreateDrawer = refDebounced(showCreateDigitalCertificateDrawer, DEBOUNCE_TIME_IN_MS)

  const certificateTypes = {
    EDGE_CERTIFICATE_UPLOAD: 'edge_certificate',
    EDGE_CERTIFICATE_CSR: 'generateCSR',
    TRUSTED: 'trusted_ca_certificate'
  }
  const CSRConditionalValidations = {
    is: certificateTypes.EDGE_CERTIFICATE_CSR,
    then: (schema) => schema.required('Field Required')
  }

  const createServiceBySelectedType = ref(createDigitalCertificatesService)

  const certificateSelection = ref('uploadCertificateAndPrivateKey')
  const initialValues = ref({
    digitalCertificateName: '',
    // Edge Certificate values
    certificate: '',
    privateKey: undefined,

    // CSR values
    common: '',
    country: '',
    state: '',
    city: '',
    organization: '',
    organizationUnity: '',
    email: '',
    privateKeyType: 'RSA (2048)',
    subjectAlternativeNames: '',
    certificateType: 'edge_certificate'
  })

  const certificateRequiredField = (certificateType) => {
    const isTrustedCA = certificateType === certificateTypes.TRUSTED

    return isTrustedCA
  }
  const validationSchema = yup.object({
    digitalCertificateName: yup.string().required('Name is a required field.'),

    // Certificate Choices
    certificateType: yup.string().required('Choose a certificate type.'),

    // Edge Certificate Fields
    certificate: yup.string().when(['certificateType'], {
      is: certificateRequiredField,
      then: (schema) => schema.required('Certificate is a required field.')
    }),
    privateKey: yup.string(),

    // CSR Fields
    common: yup.string().when('certificateType', CSRConditionalValidations),
    country: yup.string().when('certificateType', {
      is: certificateTypes.EDGE_CERTIFICATE_CSR,
      then: (schema) =>
        schema
          .required('Country/Region is a required field.')
          .max(2, 'Country/Region must be a 2-character country code.')
          .min(2, 'Country/Region must be a 2-character country code.')
    }),
    state: yup.string().when('certificateType', CSRConditionalValidations),
    city: yup.string().when('certificateType', CSRConditionalValidations),
    organizationUnity: yup
      .string()
      .when('certificateType', CSRConditionalValidations)
      .label('organization unity'),
    organization: yup.string().when('certificateType', CSRConditionalValidations),
    privateKeyType: yup
      .string()
      .when('certificateType', CSRConditionalValidations)
      .label('private key type'),
    email: yup.string().when('certificateType', {
      is: certificateTypes.EDGE_CERTIFICATE_CSR,
      then: (schema) => schema.required('Email is a required field.').email()
    }),
    subjectAlternativeNames: yup
      .string()
      .when('certificateType', CSRConditionalValidations)
      .label('subject alternative names (SAN)')
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
  const handleCreateWithSuccess = () => {
    handleTrackSuccessCreated()
    emit('onSuccess')
    emit('onEdgeApplicationCreated')
    closeCreateDrawer()
  }

  watch(certificateSelection, () => {
    const isEdgeCertificateCSR =
      certificateSelection.value === certificateTypes.EDGE_CERTIFICATE_CSR

    createServiceBySelectedType.value = isEdgeCertificateCSR
      ? createDigitalCertificatesCSRService
      : createDigitalCertificatesService
  })

  defineExpose({
    showCreateDrawer,
    openCreateDrawer
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="showCreateDrawer"
    v-model:visible="showCreateDigitalCertificateDrawer"
    :createService="createServiceBySelectedType"
    :schema="validationSchema"
    drawerId="digital-certificates-drawer"
    :initialValues="initialValues"
    @onSuccess="handleCreateWithSuccess"
    @onResponseFail="handleTrackFailedToCreate"
    title="Create Digital Certificate"
  >
    <template #formFields>
      <FormFieldsCreateDigitalCertificates
        isDrawer
        v-model:certificate-selection="certificateSelection"
      />
    </template>
  </CreateDrawerBlock>
</template>
