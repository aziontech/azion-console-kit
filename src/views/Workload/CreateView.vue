<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Workload"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="createDomainService"
        disabledCallback
        @on-response="handleResponse"
        @on-response-fail="handleTrackFailedCreation"
        :schema="validationSchema"
        :initialValues="initialValues"
        disableAfterCreateToastFeedback
      >
        <template #form>
          <FormFieldsCreateDomains
            :digitalCertificates="digitalCertificates"
            :listEdgeApplicationsService="listEdgeApplicationsService"
            :loadEdgeApplicationsService="loadEdgeApplicationsService"
            :listEdgeFirewallService="edgeFirewallService.listEdgeFirewallService"
            :loadEdgeFirewallService="edgeFirewallService.loadEdgeFirewallService"
            :loadDigitalCertificatesService="loadDigitalCertificatesService"
            :isLoadingRequests="isLoadingRequests"
          />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarTemplate
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
  import { ref, inject } from 'vue'
  import { useToast } from 'primevue/usetoast'

  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsCreateDomains from './FormFields/FormFieldsCreateDomains.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import CopyDomainDialog from './Dialog/CopyDomainDialog.vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDialog } from 'primevue/usedialog'
  import * as yup from 'yup'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { edgeFirewallService } from '@/services/v2'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const MTLS_VERIFICATION_ENFORCE = 'enforce'

  const props = defineProps({
    createDomainService: {
      type: Function,
      required: true
    },
    loadDigitalCertificatesService: {
      type: Function,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    },
    listEdgeApplicationsService: {
      type: Function,
      required: true
    },
    loadEdgeApplicationsService: {
      type: Function,
      required: true
    },
    listEdgeFirewallService: {
      type: Function,
      required: true
    },
    loadEdgeFirewallService: {
      type: Function,
      required: true
    }
  })

  const toast = useToast()
  const route = useRoute()
  const dialog = useDialog()
  const router = useRouter()

  const digitalCertificates = ref([])
  const domainName = ref('')
  const isLoadingRequests = ref(true)

  const handleResponse = (value) => {
    domainName.value = value?.domainName
    dialog.open(CopyDomainDialog, {
      data: {
        domain: domainName.value,
        copy: copyDomain
      },
      onClose: () => {
        router.push({ path: value.urlToEditView })
        renderToastDomainCreateSuccesfully()
      }
    })
    tracker.product.productCreated({
      productName: 'Domain',
      createdFrom: 'singleEntity',
      from: route.query.origin
    })
  }

  const copyDomain = async () => {
    const toastConfig = {
      closable: true,
      severity: 'success',
      summary: 'Successfully copied!'
    }

    try {
      props.clipboardWrite(domainName.value)
      toast.add({ ...toastConfig })
    } catch (error) {
      toast.add({
        ...toastConfig,
        severity: 'error',
        detail: 'The domain was not copied to the clipboard. Try copying it again.'
      })
    }
  }

  const renderToastDomainCreateSuccesfully = () => {
    const toastConfig = {
      closable: true,
      severity: 'success',
      summary: 'Succesfully created!',
      detail: 'The domain is now available in the Workload management section.'
    }
    toast.add({ ...toastConfig })
  }

  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Domains',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const initialValues = {
    name: '',
    environment: '1',
    edgeApplication: null,
    edgeFirewall: null,
    deliveryProtocol: 'https',
    httpPort: [{ name: '80 (Default)', value: 80 }],
    httpsPort: [{ name: '443 (Default)', value: 443 }],
    quicPort: [{ name: '443 (Default)', value: 443 }],
    minimumTlsVersion: 'tls_1_2',
    useHttps: false,
    useHttp3: false,
    cnames: '',
    cnameAccessOnly: true,
    mtlsIsEnabled: false,
    mtlsVerification: MTLS_VERIFICATION_ENFORCE,
    active: true
  }

  const validationSchema = yup.object({
    name: yup
      .string()
      .label('Name')
      .required()
      .test(
        'only-ascii',
        'Invalid characters. Use letters, numbers, and standard symbols, with no accents.',
        function (value) {
          const nameRegex = /^[\x20-\x21\x23-\x7E]+$/
          return nameRegex.test(value)
        }
      ),
    edgeApplication: yup.number().label('Edge Application'),
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
    httpsPort: yup.array().when('useHttps', {
      is: true,
      then: (schema) => schema.min(1, 'At least one port is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    minimumTlsVersion: yup.string().when('useHttps', {
      is: true,
      then: (schema) => schema.required().label('TLS Version'),
      otherwise: (schema) => schema.notRequired()
    }),
    httpPort: yup.array().min(1).required(),
    quicPort: yup.array().when('useHtpp3', {
      is: true,
      then: (schema) => schema.min(1, 'At least one port is required'),
      otherwise: (schema) => schema.notRequired()
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
