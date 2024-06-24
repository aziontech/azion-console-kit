<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Domain"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="createDomainService"
        :cleanFormCallback="resetForm"
        :disabledCallback="true"
        @on-response="handleResponse"
        @on-response-fail="handleTrackFailedCreation"
        :schema="validationSchema"
        :initialValues="initialValues"
        disableAfterCreateToastFeedback
      >
        <template #form>
          <FormFieldsCreateDomains
            :digitalCertificates="digitalCertificates"
            :edgeApps="edgeApps"
          ></FormFieldsCreateDomains>
        </template>
        <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
            :submitDisabled="!formValid"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { ref, onMounted, inject } from 'vue'
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

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const MTLS_VERIFICATION_ENFORCE = 'enforce'

  const props = defineProps({
    createDomainService: {
      type: Function,
      required: true
    },
    listDigitalCertificatesService: {
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
    }
  })

  const toast = useToast()
  const route = useRoute()
  const dialog = useDialog()
  const router = useRouter()

  const edgeApps = ref([])
  const digitalCertificates = ref([])
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
    const toastConfig = {
      closable: true,
      severity: 'success',
      summary: 'Domain copied to clipboard!'
    }

    try {
      props.clipboardWrite(domainName.value)
      toast.add({ ...toastConfig })
    } catch (error) {
      toast.add({
        ...toastConfig,
        severity: 'error',
        detail: 'The Domain could not be copied to clipboard. Please try again.'
      })
    }
  }

  const renderToastDomainCreateSuccesfully = () => {
    const toastConfig = {
      closable: false,
      severity: 'success',
      summary: 'Succesfully created',
      detail: 'The domain is now available in the Domain management section.'
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

  const requestEdgeApplications = async () => {
    edgeApps.value = await props.listEdgeApplicationsService({})
  }

  const requestDigitalCertificates = async () => {
    digitalCertificates.value = await props.listDigitalCertificatesService({})
  }
  const showToast = (severity, summary) => {
    const options = {
      closable: true,
      severity,
      summary
    }

    toast.add(options)
  }

  const toastError = (error) => {
    showToast('error', error)
  }

  onMounted(async () => {
    try {
      await Promise.all([requestEdgeApplications(), requestDigitalCertificates()])
    } catch (error) {
      toastError(error)
    }
  })

  const initialValues = {
    cnames: '',
    cnameAccessOnly: true,
    edgeApplication: null,
    mtlsIsEnabled: false,
    active: true,
    mtlsVerification: MTLS_VERIFICATION_ENFORCE
  }

  const validationSchema = yup.object({
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
    active: yup.boolean(),
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
    edgeApplication: yup.number(),
    edgeCertificate: yup.string().optional(),
    mtlsIsEnabled: yup.boolean(),
    mtlsVerification: yup.string(),
    mtlsTrustedCertificate: yup.string().when('mtlsIsEnabled', {
      is: true,
      then: (schema) => schema.required()
    })
  })
</script>
