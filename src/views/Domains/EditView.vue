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
        :cleanFormCallback="resetForm"
        :updatedRedirect="updatedRedirect"
        :initialValues="initialValues"
        @on-edit-success="handleTrackEditEvent"
        @on-edit-fail="handleTrackFailEditEvent"
      >
        <template #form>
          <FormFieldsEditDomains
            :digitalCertificates="digitalCertificates"
            :edgeApps="edgeApps"
            :domainName="domainName"
            :hasDomainName="true"
            @copyDomainName="copyDomainName"
          />
        </template>
        <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
            :submitDisabled="!formValid"
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

  const edgeApps = ref([])
  const digitalCertificates = ref([])
  const toast = useToast()

  const requestEdgeApplications = async () => {
    edgeApps.value = await props.listEdgeApplicationsService({})
  }

  const requestDigitalCertificates = async () => {
    digitalCertificates.value = await props.listDigitalCertificatesService({})
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
    showToast('success', 'domain name copied')
  }

  onMounted(async () => {
    try {
      await Promise.all([requestEdgeApplications(), requestDigitalCertificates()])
    } catch (error) {
      toastError(error)
    }
  })

  const validationSchema = yup.object({
    id: yup.string().required(),
    name: yup.string().required(),
    domainName: yup.string().required(),
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
