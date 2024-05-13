<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Domain"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="createDomainService"
        :cleanFormCallback="resetForm"
        :schema="validationSchema"
        :initialValues="initialValues"
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
  import { ref, onMounted } from 'vue'
  import { useToast } from 'primevue/usetoast'

  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsCreateDomains from './FormFields/FormFieldsCreateDomains.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import { TOAST_LIFE } from '@/utils/constants'

  import * as yup from 'yup'

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
    listEdgeApplicationsService: {
      type: Function,
      required: true
    }
  })
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
    const options = {
      closable: true,
      severity,
      summary
    }

    if (severity === 'success') {
      options.life = TOAST_LIFE
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
    name: yup.string().required(),
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
