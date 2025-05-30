<template>
  <EditFormBlock
    :editService="editDomainService"
    :loadService="loadDomainService"
    :schema="validationSchema"
    :updatedRedirect="updatedRedirect"
    @loaded-service-object="setDomainName"
    @on-edit-success="handleTrackEditEvent"
    @on-edit-fail="handleTrackFailEditEvent"
    isTabs
  >
    <template #form>
      <FormFieldsEditDomains
        :digitalCertificates="digitalCertificates"
        :listDigitalCertificatesService="listDigitalCertificatesService"
        :loadDigitalCertificatesService="loadDigitalCertificatesService"
        hasDomainName
        @copyDomainName="copyDomainName"
      />
    </template>
    <template #action-bar="{ onSubmit, onCancel, loading }">
      <ActionBarTemplate
        @onSubmit="onSubmit"
        @onCancel="onCancel"
        :loading="loading"
      />
    </template>
  </EditFormBlock>
</template>

<script setup>
  import { ref, inject } from 'vue'

  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsEditDomains from './FormFields/FormFieldsEditDomains.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import * as yup from 'yup'
  import { useToast } from 'primevue/usetoast'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    editDomainService: {
      type: Function,
      required: true
    },
    listDigitalCertificatesService: {
      type: Function,
      required: true
    },
    loadDigitalCertificatesService: {
      type: Function,
      required: true
    },
    updatedRedirect: {
      type: String,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    },
    updateDigitalCertificates: {
      type: Function,
      required: true
    },
    domain: {
      type: Object,
      required: true
    }
  })

  const handleTrackEditEvent = () => {
    tracker.product.productEdited({
      productName: 'Domain'
    })
  }

  const handleTrackFailEditEvent = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Domain',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const digitalCertificates = ref([])
  const toast = useToast()
  const domainName = ref()

  const showToast = (severity, summary) => {
    toast.add({
      closable: true,
      severity,
      summary
    })
  }

  const copyDomainName = ({ name }) => {
    props.clipboardWrite(name)
    showToast('success', 'Successfully copied!')
  }

  const setDomainName = async (domain) => {
    domainName.value = domain.name
  }

  const loadDomainService = () => {
    return props.domain
  }

  const validationSchema = yup.object({
    id: yup.string().required(),
    name: yup
      .string()
      .required()
      .test(
        'only-ascii',
        'Invalid characters. Use letters, numbers, and standard symbols, with no accents.',
        function (value) {
          const nameRegex = /^[\x20-\x21\x23-\x7E]+$/
          return nameRegex.test(value)
        }
      ),
    domainName: yup.string().required(),
    httpsPort: yup.array().when('useHttps', {
      is: true,
      then: (schema) => schema.min(1, 'At least one port is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    httpPort: yup.array().min(1).required(),
    quicPort: yup.array().when('useHtpp3', {
      is: true,
      then: (schema) => schema.min(1, 'At least one port is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    cnames: yup
      .string()
      .label('CNAME')
      .when('cnameAccessOnly', {
        is: true,
        then: (schema) => schema.required()
      })
      .test({
        name: 'no-whitespace',
        message: `Space characters aren't allowed.`,
        test: (value) => value?.includes(' ') === false
      }),
    cnameAccessOnly: yup.boolean(),
    edgeCertificate: yup.string().optional(),
    mtlsIsEnabled: yup.boolean(),
    mtlsVerification: yup.string(),
    mtlsTrustedCertificate: yup
      .string()
      .when('mtlsIsEnabled', {
        is: true,
        then: (schema) => schema.required()
      })
      .label('Trusted CA Certificate'),
    active: yup.boolean(),
    environment: yup.string()
  })
</script>
