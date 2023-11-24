<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Domain"></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="editDomainService"
        :loadService="loadDomainService"
        :initialDataSetter="setValues"
        :formData="values"
        :formMeta="meta"
        :cleanFormCallback="resetForm"
        :updatedRedirect="updatedRedirect"
      >
        <template #form>
          <form-horizontal
            title="General"
            description="Check the details of the Azion domain, including
        the domain address to access the application, and modify
        digital certificate options."
          >
            <template #inputs>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label
                  for="name"
                  class="text-color text-base font-medium"
                  >Name *</label
                >
                <InputText
                  v-bind="name"
                  id="name"
                  type="text"
                  :class="{ 'p-invalid': errors.name }"
                />
                <small
                  v-if="errors.name"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.name }}</small
                >
              </div>
            </template>
          </form-horizontal>
          <form-horizontal
            title="Settings"
            description="Determine the edge application of the domain and its digital certificate. 
        To link an existing domain to an application, add it to the CNAME field and
        block access to the application via the Azion domain."
          >
            <template #inputs>
              <div class="flex flex-col w-full sm:max-w-xs gap-2">
                <label
                  for="edge_application"
                  class="text-color text-base font-medium"
                  >Edge Application *</label
                >
                <Dropdown
                  id="edge_application"
                  :class="{ 'p-invalid': errors.edgeApplication }"
                  v-model="edgeApplication"
                  :options="edgeApplicationOptions"
                  optionLabel="name"
                  optionValue="value"
                  class="w-full"
                  placeholder="Select an edge application"
                />
                <small
                  v-if="errors.edgeApplication"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.edgeApplication }}</small
                >
              </div>

              <div class="flex gap-2 items-top">
                <InputSwitch
                  id="cnameAccessOnly"
                  class="flex-shrink-0 flex-grow"
                  :class="{ 'p-invalid': errors.cnameAccessOnly }"
                  v-model="cnameAccessOnly"
                />
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-normal leading-tight">CNAME Access Only </label>
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Check this option to make the application accessible only through the domains
                    listed in the CNAME field. Attempts to access the application through the Azion
                    domain will be blocked.
                  </small>
                </div>
              </div>

              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label
                  for="cname"
                  class="text-color text-base font-medium"
                  >{{ CNAMELabel }}</label
                >
                <PrimeTextarea
                  id="cname"
                  :class="{ 'p-invalid': errors.cnames }"
                  v-model="cnames"
                  rows="2"
                  cols="30"
                  class="w-full"
                />
                <small
                  v-if="errors.cnames"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.cnames }}</small
                >
              </div>

              <div class="flex flex-col w-full sm:max-w-xs gap-2">
                <label
                  for="edge_application"
                  class="text-color text-base font-medium"
                  >Edge Certificate</label
                >
                <Dropdown
                  :class="{ 'p-invalid': errors.edgeCertificate }"
                  v-model="edgeCertificate"
                  :options="edgeCertificatesOptions"
                  optionLabel="name"
                  optionValue="value"
                  class="w-full"
                  placeholder="Select a certificate"
                />
              </div>
            </template>
          </form-horizontal>
          <form-horizontal
            title="Mutual Authentication Settings"
            description="Enable Mutual Authentication (mTLS) to require that both client and server present an authentication protocol to each other."
          >
            <template #inputs>
              <div class="flex gap-3 items-center">
                <InputSwitch
                  id="mtls"
                  :class="{ 'p-invalid': errors.mtlsIsEnabled }"
                  v-model="mtlsIsEnabled"
                />
                <label
                  for="mtls"
                  class="text-base"
                  >Mutual Authentication</label
                >
              </div>

              <div
                v-if="mtlsIsEnabled"
                class="flex flex-col gap-2"
              >
                <label class="text-color text-base font-medium">Verification</label>
                <div class="flex flex-col gap-3">
                  <Card
                    :pt="{
                      body: { class: 'p-4' },
                      title: { class: 'flex justify-between font-medium text-base m-0' },
                      subtitle: {
                        class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
                      }
                    }"
                  >
                    <template #title>
                      <span class="text-base">Enforce</span>
                      <RadioButton
                        :disabled="!mtlsIsEnabled"
                        v-model="mtlsVerification"
                        inputId="enforce"
                        name="mtls-verification"
                        value="enforce"
                      />
                    </template>
                    <template #subtitle>
                      This option blocks the client certificate during the TLS handshake if the
                      uploaded Trusted CA can't be validated.
                    </template>
                  </Card>

                  <Card
                    :pt="{
                      body: { class: 'p-4' },
                      title: { class: 'flex justify-between font-medium text-base m-0' },
                      subtitle: {
                        class: 'text-sm font-normal text-color-secondary m-0 pr-[2.5rem]'
                      }
                    }"
                  >
                    <template #title>
                      <span class="text-base">Permissive</span>
                      <RadioButton
                        :disabled="!mtlsIsEnabled"
                        v-model="mtlsVerification"
                        inputId="permissive"
                        name="mtls-verification"
                        value="permissive"
                      />
                    </template>
                    <template #subtitle>
                      This option attempts to verify the client certificate, but will allow the TLS
                      handshake even if the Trusted CA can't be validated. You can check which
                      client certificate attempted the request in Edge Firewall.
                    </template>
                  </Card>
                </div>
              </div>
              <div
                v-if="mtlsIsEnabled"
                class="flex flex-col w-full sm:max-w-xs gap-2"
              >
                <label class="text-color text-base font-medium">Trusted CA Certificate</label>
                <Dropdown
                  :class="{ 'p-invalid': errors.mtlsTrustedCertificate }"
                  v-model="mtlsTrustedCertificate"
                  :options="trustedCACertificatesOptions"
                  optionLabel="name"
                  optionValue="value"
                  class="w-full"
                  placeholder="Select a certificate"
                  :disabled="!mtlsIsEnabled"
                />
                <small class="text-xs font-normal text-color-secondary leading-tight">
                  Mutual Authentification requires a Trusted CA Certificate, add it in Digital
                  Certificate Library.
                </small>
                <small
                  v-if="errors.mtlsTrustedCertificate"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.mtlsTrustedCertificate }}</small
                >
              </div>
            </template>
          </form-horizontal>

          <form-horizontal title="Status">
            <template #inputs>
              <div class="flex gap-3 items-center">
                <InputSwitch
                  id="active"
                  v-model="active"
                />
                <label
                  for="active"
                  class="text-base"
                  >Active</label
                >
              </div>
            </template>
          </form-horizontal>
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>

<script>
  import EditFormBlock from '@/templates/edit-form-block-new'
  import InputText from 'primevue/inputtext'
  import Dropdown from 'primevue/dropdown'
  import PrimeTextarea from 'primevue/textarea'
  import InputSwitch from 'primevue/inputswitch'
  import RadioButton from 'primevue/radiobutton'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import Card from 'primevue/card'
  import formHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import { useField, useForm } from 'vee-validate'
  import * as yup from 'yup'
  import {
    EDGE_CERTIFICATE,
    TRUSTED_CA_CERTIFICATE
  } from '@/services/digital-certificates-services'

  const MTLS_VERIFICATION_ENFORCE = 'enforce'
  const MTLS_VERIFICATION_PERMISSIVE = 'permissive'

  export default {
    components: {
      EditFormBlock,
      InputText,
      Dropdown,
      PrimeTextarea,
      InputSwitch,
      RadioButton,
      formHorizontal,
      Card,
      ContentBlock,
      PageHeadingBlock
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
    computed: {
      CNAMELabel() {
        return this.cnameAccessOnly ? 'CNAME *' : 'CNAME'
      },
      edgeCertificates() {
        return this.digitalCertificates.filter(
          (certificate) => certificate.type === EDGE_CERTIFICATE
        )
      },
      trustedCACertificates() {
        return this.digitalCertificates.filter(
          (certificate) => certificate.type === TRUSTED_CA_CERTIFICATE
        )
      },
      edgeApplicationOptions() {
        return this.edgeApps.map((edgeApp) => ({ name: edgeApp.name, value: edgeApp.id }))
      },
      edgeCertificatesOptions() {
        const defaultCertificate = [
          { name: 'Azion (SAN)', value: 0 },
          { name: "Let's Encrypt (BETA)", value: 'lets_encrypt' }
        ]
        const parsedCertificates = this.edgeCertificates?.map((certificate) => ({
          name: certificate.name,
          value: certificate.id
        }))
        return [...defaultCertificate, ...parsedCertificates]
      },
      trustedCACertificatesOptions() {
        return this.trustedCACertificates.map((certificate) => ({
          name: certificate.name,
          value: certificate.id
        }))
      }
    },
    watch: {
      edgeCertificate(newValue) {
        if (newValue !== 0) {
          this.setEdgeCertificate(newValue)
        }
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

      const { setValues, errors, defineInputBinds, meta, resetForm, values } = useForm({
        validationSchema,
        initialValues: {
          cnames: '',
          cnameAccessOnly: false,
          edgeApplication: null,
          mtlsIsEnabled: false,
          active: false,
          mtlsVerification: MTLS_VERIFICATION_ENFORCE
        }
      })

      const { value: cnames } = useField('cnames')
      const { value: cnameAccessOnly } = useField('cnameAccessOnly')
      const { value: edgeApplication } = useField('edgeApplication')
      const { setValue: setEdgeCertificate } = useField('edgeCertificate')
      const { value: mtlsIsEnabled } = useField('mtlsIsEnabled')
      const { value: active } = useField('active')
      const { value: mtlsVerification } = useField('mtlsVerification')
      const { value: mtlsTrustedCertificate } = useField('mtlsTrustedCertificate')

      const name = defineInputBinds('name', { validateOnInput: true })
      const domainName = defineInputBinds('domainName', { validateOnInput: true })

      return {
        name,
        domainName,
        cnames,
        cnameAccessOnly,
        edgeApplication,
        setEdgeCertificate,
        mtlsIsEnabled,
        active,
        mtlsVerification,
        mtlsTrustedCertificate,
        errors,
        meta,
        resetForm,
        values,
        setValues
      }
    },
    methods: {
      async requestEdgeApplications() {
        this.edgeApps = await this.listEdgeApplicationsService({})
      },
      async requestDigitalCertificates() {
        this.digitalCertificates = await this.listDigitalCertificatesService({})
      }
    }
  }
</script>
