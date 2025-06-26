<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Workload"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="workloadService.createWorkload"
        disabledCallback
        @on-response="handleResponse"
        @on-response-fail="handleTrackFailedCreation"
        :schema="validationSchema"
        :initialValues="initialValues"
        disableAfterCreateToastFeedback
      >
        <template #form>
          <FormFieldsWorkload
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
  import FormFieldsWorkload from './FormFields/FormFieldsWorkload.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import CopyDomainDialog from './Dialog/CopyDomainDialog.vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDialog } from 'primevue/usedialog'
  import * as yup from 'yup'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { workloadService, edgeFirewallService } from '@/services/v2'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    createDomainService: {
      type: Function,
      required: true
    },
    loadDigitalCertificatesService: {
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
    },
    listCustomPagesService: {
      type: Function,
      required: true
    },
    loadCustomPagesService: {
      type: Function,
      required: true
    }
  })

  // const propsService = {
  //   edgeApplication: {
  //     listEdgeApplicationsService: props.listEdgeApplicationsService,
  //     loadEdgeApplicationsService: props.loadEdgeApplicationsService
  //   },
  //   edgeFirewall: {
  //     listEdgeFirewallService: props.listEdgeFirewallService,
  //     loadEdgeFirewallService: props.loadEdgeFirewallService
  //   },
  //   digitalCertificates: {
  //     listDigitalCertificatesService: props.listDigitalCertificatesService,
  //     loadDigitalCertificatesService: props.loadDigitalCertificatesService
  //   },
  //   customPages: {
  //     listCustomPagesService: props.listCustomPagesService,
  //     loadCustomPagesService: props.loadCustomPagesService
  //   }
  // }

  const toast = useToast()
  const route = useRoute()
  const dialog = useDialog()
  const router = useRouter()

  const domainName = ref('')

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
    try {
      props.clipboardWrite(domainName.value)
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Success',
        detail: 'Successfully copied!'
      })
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: 'The domain was not copied to the clipboard. Try copying it again.'
      })
    }
  }

  const renderToastDomainCreateSuccesfully = () => {
    toast.add({
      closable: true,
      severity: 'success',
      summary: 'Success',
      detail: 'The domain is now available in the Workload management section.'
    })
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
    edgeApplication: null,
    active: true,
    networkMap: '1',
    edgeFirewall: null,
    tls: {
      certificate: 0,
      ciphers: 7,
      minimumVersion: 'tls_1_2'
    },
    protocols: {
      http: {
        useHttps: true,
        useHttp3: true,
        httpPorts: [{ name: '80 (Default)', value: 80 }],
        httpsPorts: [{ name: '443 (Default)', value: 443 }],
        quicPorts: [{ name: '443 (Default)', value: 443 }]
      }
    },
    mtls: {
      isEnabled: false,
      verification: 'enforce',
      certificate: null,
      crl: []
    },
    domains: [
      {
        subdomain: '',
        domain: ''
      }
    ],
    workloadHostnameAllowAccess: true,
    useCustomDomain: false,
    customDomain: ''
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
    edgeApplication: yup.number().required().label('Edge Application'),
    active: yup.boolean(),
    networkMap: yup.string(),
    edgeFirewall: yup.number().label('Edge Firewall').nullable(),
    tls: yup.object({
      isEnabled: yup.boolean(),
      certificate: yup.string(),
      ciphers: yup.string(),
      minimumVersion: yup.string()
    }),
    protocols: yup.object({
      http: yup.object({
        useHttps: yup.boolean(),
        useHttp3: yup.boolean(),
        versions: yup.array(),
        httpPorts: yup.array().when('useHttp3', {
          is: true,
          then: (schema) => schema.min(1, 'At least one port is required'),
          otherwise: (schema) => schema.notRequired()
        }),
        httpsPorts: yup.array().when('useHttps', {
          is: true,
          then: (schema) => schema.min(1, 'At least one port is required'),
          otherwise: (schema) => schema.notRequired()
        }),
        quicPorts: yup.array().when('useHttp3', {
          is: true,
          then: (schema) => schema.min(1, 'At least one port is required'),
          otherwise: (schema) => schema.notRequired()
        })
      })
    }),
    mtls: yup.object({
      verification: yup.string().label('Verification'),
      certificate: yup
        .string()
        .when('isEnabled', {
          is: true,
          then: (schema) => schema.required()
        })
        .label('Trusted CA Certificate'),
      crl: yup.array().label('Certificate Revocation List')
    }),
    domains: yup
      .array()
      .of(
        yup.object({
          id: yup.number(),
          subdomain: yup
            .string()
            .test('valid-subdomain', 'Invalid Subdomain format', function (value) {
              if (!value) return true // Allow empty subdomain
              return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(value)
            })
            .label('Subdomain'),
          domain: yup
            .string()
            .test('valid-domain', 'Invalid Domain format', function (value) {
              if (!value) return true // Allow empty domain
              // Regex para validar domínio: deve conter letras/números, ponto e TLD
              return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(value)
            })
            .label('Domain')
        })
      )
      .when('workloadHostnameAllowAccess', {
        is: false,
        then: (schema) =>
          schema.test(
            'has-filled-domain',
            'At least one domain with subdomain and domain is required',
            (value) => value?.some((domain) => domain.subdomain && domain.domain)
          )
      }),
    useCustomDomain: yup.boolean(),
    customDomain: yup
      .string()
      .when('useCustomDomain', {
        is: true,
        then: (schema) =>
          schema
            .required()
            .test('valid-custom-domain', 'Invalid custom domain format', function (value) {
              if (!value) return true // Allow empty hostname
              return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(value)
            })
      })
      .label('Custom Domain'),
    workloadHostnameAllowAccess: yup.boolean()
  })
</script>
