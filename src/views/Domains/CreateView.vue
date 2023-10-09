<template>
  <CreateFormBlock
    pageTitle="Create Domain"
    :createService="createDomainService"
    :formData="values"
    :isValid="meta.valid"
    :cleanFormCallback="resetForm"
  >
    <template #form>
      <b>Settings</b>
      <div class="flex flex-col gap-2">
        <label for="name">Name:</label>
        <InputText
          placeholder="Add Domain Name"
          v-bind="name"
          type="text"
          :class="{ 'p-invalid': errors.name }"
          v-tooltip.top="errors.name"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="edge-application">Edge Application:</label>
        <Dropdown
          :class="{ 'p-invalid': errors.edgeApplication }"
          v-model="edgeApplication"
          :options="edgeApplicationOptions"
          optionLabel="name"
          optionValue="value"
          class="w-full"
          placeholder="Select an edge application"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="cname">CNAME:</label>
        <PrimeTextarea
          :class="{ 'p-invalid': errors.cname }"
          v-model="cnames"
          rows="5"
          cols="30"
          class="w-full"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="cname-access-only">CNAME Access Only:</label>
        <InputSwitch
          :class="{ 'p-invalid': errors.cnameAccessOnly }"
          v-model="cnameAccessOnly"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="edge-certificate">Edge Certificate:</label>
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

      <b>Mutual Authentication Settings</b>

      <div class="flex flex-col gap-2">
        <label for="enable-mutual-authentication">Enable Mutual Authentication:</label>
        <InputSwitch
          :class="{ 'p-invalid': errors.mtlsIsEnabled }"
          v-model="mtlsIsEnabled"
        />
      </div>

      <label for="verification">Verification:</label>
      <div class="flex flex-wrap gap-3">
        <div
          v-for="item in verificationOptions"
          :key="item.value"
          class="flex align-items-center"
        >
          <RadioButton
            :disabled="!mtlsIsEnabled"
            v-model="mtlsVerification"
            :inputId="item.value"
            name="mtls-verification"
            :value="item.value"
          />
          <label
            :for="item.value"
            class="ml-2"
            >{{ item.name }}</label
          >
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label for="trusted-certificate">Trusted CA Certificate:</label>
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
      <div class="mb-4"></div>
    </template>
  </CreateFormBlock>
</template>

<script>
  import CreateFormBlock from '@/templates/create-form-block'
  import InputText from 'primevue/inputtext'
  import Dropdown from 'primevue/dropdown'
  import PrimeTextarea from 'primevue/textarea'
  import InputSwitch from 'primevue/inputswitch'
  import RadioButton from 'primevue/radiobutton'
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
      RadioButton
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
        cnames: yup.string().when('cnameAccessOnly', {
          is: true,
          then: (schema) => schema.required()
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
