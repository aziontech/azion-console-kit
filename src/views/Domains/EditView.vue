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
      >
        <template #form>
          <FormFieldsCreate
            :digitalCertificates="digitalCertificates"
            :edgeApps="edgeApps"
            :domainName="domainName"
            :hasDomainName="true"
            @copyDomainName="copyDomainName"
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
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>

<script>
  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsCreate from './FormFields/FormFieldsCreate.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import * as yup from 'yup'
  const MTLS_VERIFICATION_ENFORCE = 'enforce'
  const MTLS_VERIFICATION_PERMISSIVE = 'permissive'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'


  export default {
    components: {
      EditFormBlock,
      ContentBlock,
      PageHeadingBlock,
      FormFieldsCreate,
      ActionBarTemplate
    },
    props: {
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
    },
    data() {
      return {
        verificationOptions: [
          { name: 'Enforce', value: MTLS_VERIFICATION_ENFORCE },
          { name: 'Permissive', value: MTLS_VERIFICATION_PERMISSIVE }
        ],
        trustedCertificateOptions: [],
        edgeApps: [],
        digitalCertificates: [],
        edgeCertificate: 0
      }
    },
    async created() {
      try {
        await Promise.all([this.requestEdgeApplications(), this.requestDigitalCertificates()])
      } catch (error) {
        this.$toast.add({
          closable: false,
          severity: 'error',
          summary: error,
          life: 10000
        })
      }
    },
    setup() {
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


      const initialValues = {
        cnames: '',
        cnameAccessOnly: true,
        edgeApplication: null,
        mtlsIsEnabled: false,
        active: true,
        mtlsVerification: MTLS_VERIFICATION_ENFORCE
      }

      return {
        initialValues,
        validationSchema
      }
    },
    methods: {
      async requestEdgeApplications() {
        this.edgeApps = await this.listEdgeApplicationsService({})
      },
      async requestDigitalCertificates() {
        this.digitalCertificates = await this.listDigitalCertificatesService({})
      },
      copyDomainName({ name }) {
        this.clipboardWrite(name)
        this.$toast.add({
          closable: false,
          severity: 'success',
          summary: 'domain name copied',
          life: 10000
        })
      }
    }
  }
</script>
