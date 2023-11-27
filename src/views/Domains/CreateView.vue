<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Domain"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="createDomainService"
        :formData="values"
        :formMeta="meta"
        :cleanFormCallback="resetForm"
      >
        <template #form>
          <form-horizontal
            title="General"
            description="Create a domain with Azion to launch an edge application and set up security with digital certificates."
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
            title="Domain"
            description="Save the domain to visualize the Domain name attributed by Azion to this configuration."
          >
            <template #inputs>
              <div class="flex flex-col w-full gap-2">
                <label
                  for="domainName"
                  class="text-color text-base font-medium"
                >
                  Domain Name
                </label>
                <div
                  class="flex gap-6 md:align-items-center max-sm:flex-col max-sm:align-items-baseline max-sm:gap-3"
                >
                  <span class="p-input-icon-right w-full flex max-w-lg flex-col items-start gap-2">
                    <i class="pi pi-lock" />
                    <InputText
                      id="domainName"
                      v-model="domainName"
                      type="text"
                      class="flex flex-col w-full"
                      :feedback="false"
                      disabled
                    />
                  </span>
                  <PrimeButton
                    icon="pi pi-clone"
                    outlined
                    type="button"
                    aria-label="Copy Domain Name"
                    label="Copy to Clipboard"
                    :disabled="!hasDomainName"
                    @click="copyDomainName"
                  />
                </div>
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
                      handshake even if the Trusted CA can't be validated. Check which client
                      certificate attempted the request in Edge Firewall, if necessary.
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
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script>
  import CreateFormBlock from '@/templates/create-form-block'
  import InputText from 'primevue/inputtext'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import PrimeTextarea from 'primevue/textarea'
  import InputSwitch from 'primevue/inputswitch'
  import RadioButton from 'primevue/radiobutton'
  import Card from 'primevue/card'
  import formHorizontal from '@/templates/create-form-block/form-horizontal'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

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
      CreateFormBlock,
      InputText,
      Dropdown,
      PrimeTextarea,
      InputSwitch,
      RadioButton,
      formHorizontal,
      Card,
      PrimeButton,
      ContentBlock,
      PageHeadingBlock
    },
    props: {
      createDomainService: Function,
      listDigitalCertificatesService: Function,
      listEdgeApplicationsService: Function,
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
        edgeCertificate: 0,
        domainName: '',
        hasDomainName: false
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
        name: yup.string().required('Name is a required field'),
        cnames: yup
          .string()
          .label('CNAME')
          .when('cnameAccessOnly', {
            is: true,
            then: (schema) => schema.required('CNAME is a required field.')
          })
          .test({
            name: 'no-whitespace',
            message: `Space characters aren't allowed.`,
            test: (value) => value?.includes(' ') === false
          }),
        cnameAccessOnly: yup.boolean(),
        edgeApplication: yup.number().required(),
        edgeCertificate: yup.string().optional(),
        mtlsIsEnabled: yup.boolean(),
        active: yup.boolean(),
        mtlsVerification: yup.string(),
        trustedCACertificates: yup.string().optional(),
        mtlsTrustedCertificate: yup.string().when('mtlsIsEnabled', {
          is: true,
          then: (schema) => schema.required('Trusted CA Certificate is a required field.')
        })
      })

      const { errors, defineInputBinds, meta, resetForm, values } = useForm({
        validationSchema,
        initialValues: {
          cnames: '',
          cnameAccessOnly: true,
          edgeApplication: null,
          mtlsIsEnabled: false,
          active: true,
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

      return {
        name,
        cnames,
        cnameAccessOnly,
        edgeApplication,
        setEdgeCertificate,
        mtlsIsEnabled,
        mtlsVerification,
        mtlsTrustedCertificate,
        errors,
        meta,
        active,
        resetForm,
        values
      }
    },
    methods: {
      async requestEdgeApplications() {
        this.edgeApps = await this.listEdgeApplicationsService({})
      },
      async requestDigitalCertificates() {
        this.digitalCertificates = await this.listDigitalCertificatesService({})
      },
      handleResponse(data) {
        this.$toast.add({
          closable: false,
          severity: 'success',
          summary: data.feedback,
          life: 10000
        })
        if (data.domainName) {
          this.domainName = data.domainName
          this.hasDomainName = true
        }
      },
      copyDomainName() {
        this.clipboardWrite(this.domainName)
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
