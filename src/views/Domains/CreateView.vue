<template>
  <CreateFormBlock
    pageTitle="Create Domain"
    :createService="createDomainService"
    :formData="values"
    :isValid="meta.valid"
    :cleanFormCallback="resetForm"
  >
    <template #form>
      <form-horizontal
        title="General"
        description=""
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="name"
              class="text-color text-base font-medium"
              >Name *</label
            >
            <InputText
              placeholder="Add Domain Name"
              v-bind="name"
              id="name"
              type="text"
              :class="{ 'p-invalid': errors.name }"
              v-tooltip.top="errors.name"
            />
          </div>
        </template>
      </form-horizontal>
      <form-horizontal
        title="Settings"
        description=""
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
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="cname"
              class="text-color text-base font-medium"
              >CNAME</label
            >
            <PrimeTextarea
              id="cname"
              :class="{ 'p-invalid': errors.cnames }"
              v-model="cnames"
              rows="2"
              cols="30"
              class="w-full"
              v-tooltip.top="errors.cnames"
            />
          </div>
          <Card
            :pt="{
              body: { class: 'p-4' },
              title: { class: 'flex justify-between font-medium items-cente text-base m-0' },
              subtitle: { class: 'text-sm font-normal text-color-secondary m-0' }
            }"
          >
            <template #title>
              <span class="text-base">CNAME Access Only</span>
              <InputSwitch
                :class="{ 'p-invalid': errors.cnameAccessOnly }"
                v-model="cnameAccessOnly"
              />
            </template>
            <template #subtitle>
              Check this field to make content only accessible through the domains defined in the
              CNAME field. Access attempts made through Azion's domain (e.g. 10001a.hc.azioncdn.net)
              will not go through.
            </template>
          </Card>
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
              placeholder="Select a Certificate"
            />
          </div>
        </template>
      </form-horizontal>
      <form-horizontal
        title="Mutual Authentication Settings"
        description="The Mutual Authentication or mTLS, allows two parties authenticating each other at the same time in an authentication protocol."
      >
        <template #inputs>
          
          <Card
            :pt="{
              body: { class: 'p-4' },
              title: { class: 'flex justify-between font-medium items-cente text-base m-0' },
              subtitle: { class: 'text-sm font-normal text-color-secondary m-0' }
            }"
          >
            <template #title>
              <span class="text-base">Enable Mutual Authentication</span>
              <InputSwitch
                :class="{ 'p-invalid': errors.mtlsIsEnabled }"
                v-model="mtlsIsEnabled"
              />
            </template>
            <template #subtitle>
              The Mutual Authentication or mTLS, allows two parties authenticating each other at the
              same time in an authentication protocol.
            </template>
          </Card>
          <div class="flex flex-col gap-2">
            <label class="text-color text-base font-medium">Verification</label>
            <div class="flex flex-col gap-3">
              <Card
                :pt="{
                  body: { class: 'p-4' },
                  title: { class: 'flex justify-between font-medium text-base m-0' },
                  subtitle: { class: 'text-sm font-normal text-color-secondary m-0' }
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
                  The Enforce option blocks the client's certificate during TLS handshake if we
                  cannot validate with the uploaded Trusted CA.
                </template>
              </Card>

              <Card
                :pt="{
                  body: { class: 'p-4' },
                  title: { class: 'flex justify-between font-medium text-base m-0' },
                  subtitle: { class: 'text-sm font-normal text-color-secondary m-0' }
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
                  The Permissive option will attempt to verify the client's certificate, but will
                  allow the TLS handshake even if the certificate cannot be validated. You can check
                  the client certificate in Azion Firewall and conditionally block it.
                </template>
              </Card>
            </div>
          </div>
          <div class="flex flex-col w-full sm:max-w-xs gap-2">
            <label class="text-color text-base font-medium">Trusted CA Certificate</label>
            <Dropdown
              :class="{ 'p-invalid': errors.mtlsTrustedCertificate }"
              v-model="mtlsTrustedCertificate"
              :options="trustedCACertificatesOptions"
              optionLabel="name"
              optionValue="value"
              class="w-full"
              placeholder=""
              :disabled="!mtlsIsEnabled"
            />
          </div>
        </template>
      </form-horizontal>
    </template>
  </CreateFormBlock>
</template>

<script>
  import CreateFormBlock from '@/templates/create-form-block-new'
  import InputText from 'primevue/inputtext'
  import Dropdown from 'primevue/dropdown'
  import PrimeTextarea from 'primevue/textarea'
  import InputSwitch from 'primevue/inputswitch'
  import RadioButton from 'primevue/radiobutton'
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
      CreateFormBlock,
      InputText,
      Dropdown,
      PrimeTextarea,
      InputSwitch,
      RadioButton,
      formHorizontal,
      Card
    },
    props: {
      createDomainService: Function,
      listDigitalCertificatesService: Function,
      listEdgeApplicationsService: Function
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
          closable: true,
          severity: 'error',
          summary: error,
          life: 10000
        })
      }
    },
    computed: {
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
        const def = [
          { name: 'Azion (SAN)', value: 0 },
          { name: "Let's Encrypt (BETA)", value: 'lets_encrypt' }
        ]
        let items = this.edgeCertificates.map((i) => ({ name: i.name, value: i.id }))
        return [...def, ...items]
      },
      trustedCACertificatesOptions() {
        return this.trustedCACertificates.map((i) => ({ name: i.name, value: i.id }))
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
        name: yup.string().required(),
        cnames: yup
          .string()
          .label('CNAME')
          .when('cnameAccessOnly', {
            is: true,
            then: (schema) => schema.required()
          })
          .test({
            name: 'no-whitespace',
            message: `Whitespace is not allowed`,
            test: (value) => value?.includes(' ') === false
          }),
        cnameAccessOnly: yup.boolean(),
        edgeApplication: yup.number(),
        edgeCertificate: yup.string().optional(),
        mtlsIsEnabled: yup.boolean(),
        mtlsVerification: yup.string(),
        trustedCACertificates: yup.string().optional(),
        mtlsTrustedCertificate: yup.string().when('mtlsIsEnabled', {
          is: true,
          then: (schema) => schema.required()
        })
      })

      const { errors, defineInputBinds, meta, resetForm, values } = useForm({
        validationSchema,
        initialValues: {
          cnames: '',
          cnameAccessOnly: true,
          edgeApplication: null,
          mtlsIsEnabled: false,
          mtlsVerification: MTLS_VERIFICATION_ENFORCE
        }
      })

      const { value: cnames } = useField('cnames')
      const { value: cnameAccessOnly } = useField('cnameAccessOnly')
      const { value: edgeApplication } = useField('edgeApplication')
      const { setValue: setEdgeCertificate } = useField('edgeCertificate')
      const { value: mtlsIsEnabled } = useField('mtlsIsEnabled')
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
      }
    }
  }
</script>
