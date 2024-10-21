<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Domain"></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="editDomainService"
        :loadService="loadDomainService"
        :schema="validationSchema"
        :updatedRedirect="updatedRedirect"
        @on-edit-success="handleTrackEditEvent"
        @on-edit-fail="handleTrackFailEditEvent"
      >
        <template #form>
          <FormFieldsEditDomains
            :digitalCertificates="digitalCertificates"
            :edgeApplicationsData="edgeApplicationsData"
            :domainName="domainName"
            hasDomainName
            @copyDomainName="copyDomainName"
            :loadingEdgeApplications="loadingEdgeApplications"
            :updateDigitalCertificates="updateDigitalCertificates"
            @edgeApplicationCreated="handleEdgeApplicationCreated"
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
  </ContentBlock>
</template>

<script setup>
  import { ref, onMounted, inject } from 'vue'

  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsEditDomains from './FormFields/FormFieldsEditDomains.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
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
    listEdgeApplicationsService: {
      type: Function,
      required: true
    },
    loadDomainService: {
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

  const edgeApplicationsData = ref([])
  const digitalCertificates = ref([])
  const toast = useToast()
  const loadingEdgeApplications = ref(true)

  const requestEdgeApplications = async () => {
    loadingEdgeApplications.value = true
    try {
      edgeApplicationsData.value = await props.listEdgeApplicationsService({})
    } catch (error) {
      toastError(error)
    } finally {
      loadingEdgeApplications.value = false
    }
  }

  const requestDigitalCertificates = async () => {
    digitalCertificates.value = await props.listDigitalCertificatesService({})
  }

  const handleEdgeApplicationCreated = async () => {
    await requestEdgeApplications()
  }

  const showToast = (severity, summary) => {
    toast.add({
      closable: true,
      severity,
      summary
    })
  }

  const toastError = (error) => {
    showToast('error', error)
  }
  const copyDomainName = ({ name }) => {
    props.clipboardWrite(name)
    showToast('success', 'Successfully copied!')
  }

  const scrollToTop = () => {
    window.scrollTo(0, 0)
  }

  onMounted(async () => {
    try {
      scrollToTop()
      await Promise.all([requestEdgeApplications(), requestDigitalCertificates()])
    } catch (error) {
      toastError(error)
    } finally {
      loadingEdgeApplications.value = false
    }
  })

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

  const updateDigitalCertificates = async () => {
    try {
      loadingEdgeApplications.value = true
      digitalCertificates.value = await props.listDigitalCertificatesService({})
    } catch (error) {
      toastError(error)
    } finally {
      loadingEdgeApplications.value = false
    }
  }
</script>
