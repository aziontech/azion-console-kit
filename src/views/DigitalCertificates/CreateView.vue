<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Digital Certificate"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="createServiceBySelectedType"
        :schema="validationSchema"
        :initialValues="initialValues"
      >
        <template #form>
          <InlineMessage
            class="w-fit"
            severity="info"
            >Create a Let's Encrypt™ digital certificate directly from
            <PrimeButton
              link
              size="small"
              class="p-0"
              @click="navigateToDomains"
            >
              Domains
            </PrimeButton>
          </InlineMessage>
          <FormFieldsCreateDigitalCertificates
            v-model:certificate-selection="certificateSelection"
          />
        </template>

        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarBlockWithTeleport
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import PrimeButton from 'primevue/button'
  import InlineMessage from 'primevue/inlinemessage'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import * as yup from 'yup'
  import { ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import FormFieldsCreateDigitalCertificates from './FormFields/FormFieldsCreateDigitalCertificates.vue'
  const router = useRouter()

  const props = defineProps({
    createDigitalCertificatesService: {
      type: Function,
      required: true
    },
    createDigitalCertificatesCSRService: {
      type: Function,
      required: true
    }
  })
  const createDigitalCertificateService = props.createDigitalCertificatesService
  const createCSRService = props.createDigitalCertificatesCSRService

  const certificateTypes = ref({
    EDGE_CERTIFICATE_UPLOAD: 'edge_certificate',
    EDGE_CERTIFICATE_CSR: 'generateCSR',
    TRUSTED: 'trusted_ca_certificate'
  })
  const CSRConditionalValidations = {
    is: certificateTypes.value.EDGE_CERTIFICATE_CSR,
    then: (schema) => schema.required('Field Required')
  }

  const createServiceBySelectedType = ref(createDigitalCertificateService)

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
    const isTrustedCA = certificateType === certificateTypes.value.TRUSTED

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
      is: certificateTypes.value.EDGE_CERTIFICATE_CSR,
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
      is: certificateTypes.value.EDGE_CERTIFICATE_CSR,
      then: (schema) => schema.required('Email is a required field.').email()
    }),
    subjectAlternativeNames: yup
      .string()
      .when('certificateType', CSRConditionalValidations)
      .label('subject alternative names (SAN)')
  })

  function navigateToDomains() {
    router.push({ name: 'list-domains' })
  }

  watch(certificateSelection, () => {
    const isEdgeCertificateCSR =
      certificateSelection.value === certificateTypes.value.EDGE_CERTIFICATE_CSR

    createServiceBySelectedType.value = isEdgeCertificateCSR
      ? createCSRService
      : createDigitalCertificateService
  })
</script>
