<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Domain"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="createDomainService"
        :cleanFormCallback="resetForm"
        @on-response="handleResponse"
        :schema="validationSchema"
        :initialValues="initialValues"
      >
        <template #form>
          <FormFieldsCreate
            :digitalCertificates="digitalCertificates"
            :edgeApps="edgeApps"
          ></FormFieldsCreate>
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
  import FormFieldsCreate from './FormFields/FormFieldsCreate.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'

  import * as yup from 'yup'

  const MTLS_VERIFICATION_ENFORCE = 'enforce'
  // const MTLS_VERIFICATION_PERMISSIVE = 'permissive'

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
    toast.add({
      closable: false,
      severity,
      summary,
      life: 10000
    })
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

  // export default {
  //   components: {
  //     CreateFormBlock,
  //     ContentBlock,
  //     PageHeadingBlock,
  //     FormFieldsCreate,
  //     ActionBarTemplate
  //   },
  //   props: {
  //     createDomainService: Function,
  //     listDigitalCertificatesService: Function,
  //     listEdgeApplicationsService: Function,
  //     clipboardWrite: {
  //       type: Function,
  //       required: true
  //     }
  //   },
  //   data() {
  //     return {
  //       verificationOptions: [
  //         { name: 'Enforce', value: MTLS_VERIFICATION_ENFORCE },
  //         { name: 'Permissive', value: MTLS_VERIFICATION_PERMISSIVE }
  //       ],
  //       trustedCertificateOptions: [],
  //       edgeApps: [],
  //       digitalCertificates: [],
  //       edgeCertificate: 0,
  //       domainName: '',
  //       hasDomainName: false
  //     }
  //   },
  //   async created() {
  //     try {
  //       await Promise.all([this.requestEdgeApplications(), this.requestDigitalCertificates()])
  //     } catch (error) {
  //       this.$toast.add({
  //         closable: false,
  //         severity: 'error',
  //         summary: error,
  //         life: 10000
  //       })
  //     }
  //   },
  //   setup() {
  //     const validationSchema = yup.object({
  //       name: yup.string().required('Name is a required field'),
  //       cnames: yup
  //         .string()
  //         .label('CNAME')
  //         .when('cnameAccessOnly', {
  //           is: true,
  //           then: (schema) => schema.required('CNAME is a required field.')
  //         })
  //         .test({
  //           name: 'no-whitespace',
  //           message: `Space characters aren't allowed.`,
  //           test: (value) => value?.includes(' ') === false
  //         }),
  //       cnameAccessOnly: yup.boolean(),
  //       edgeApplication: yup.number().required(),
  //       edgeCertificate: yup.string().optional(),
  //       mtlsIsEnabled: yup.boolean(),
  //       active: yup.boolean(),
  //       mtlsVerification: yup.string(),
  //       trustedCACertificates: yup.string().optional(),
  //       mtlsTrustedCertificate: yup.string().when('mtlsIsEnabled', {
  //         is: true,
  //         then: (schema) => schema.required('Trusted CA Certificate is a required field.')
  //       })
  //     })

  //     const initialValues = {
  //       cnames: '',
  //       cnameAccessOnly: true,
  //       edgeApplication: null,
  //       mtlsIsEnabled: false,
  //       active: true,
  //       mtlsVerification: MTLS_VERIFICATION_ENFORCE
  //     }

  //     return {
  //       validationSchema,
  //       initialValues
  //     }
  //   },
  //   methods: {
  //     async requestEdgeApplications() {
  //       this.edgeApps = await this.listEdgeApplicationsService({})
  //     },
  //     async requestDigitalCertificates() {
  //       this.digitalCertificates = await this.listDigitalCertificatesService({})
  //     },
  //     handleResponse(data) {
  //       this.$toast.add({
  //         closable: false,
  //         severity: 'success',
  //         summary: data.feedback,
  //         life: 10000
  //       })
  //       if (data.domainName) {
  //         this.domainName = data.domainName
  //         this.hasDomainName = true
  //       }
  //     },
  //     copyDomainName() {
  //       this.clipboardWrite(this.domainName)
  //       this.$toast.add({
  //         closable: false,
  //         severity: 'success',
  //         summary: 'domain name copied',
  //         life: 10000
  //       })
  //     }
  //   }
  // }
</script>
