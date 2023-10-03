<template>
  <CreateFormBlock
    pageTitle="Create Domain"
    :createService="createDomainService"
    :formData="values"
    :isValid="meta.valid"
    :cleanFormCallback="resetForm"
  >
    <template #form>
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
          v-model="cnamesText"
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

      <!-- <div class="flex flex-col gap-2">
        <label for="edge-certificate">Edge Certificate:</label>
        <Dropdown
          :class="{ 'p-invalid': errors.edgeCertificate }"
          v-model="edgeCertificate"
          :options="edgeCertificateOptions"
          optionLabel="name"
          optionValue="value"
          class="w-full md:w-14rem"
          placeholder="Select a Certificate"
        />
      </div> -->

      <!-- <div class="flex flex-col gap-2">
        <label for="enable-mutual-authentication">Enable Mutual Authentication:</label>
        <InputSwitch
          :class="{ 'p-invalid': errors.enableMutualAuthentication }"
          v-model="enableMutualAuthentication"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="verification">Verification:</label>
        <div
          v-for="item in verificationOptions"
          :key="item.value"
          class="flex align-items-center"
        >
          <RadioButton
            :disabled="!enableMutualAuthentication"
            v-model="verification"
            :inputId="item.value"
            name="label"
            :value="item.name"
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
          :class="{ 'p-invalid': errors.trustedCertificate }"
          v-model="trustedCertificate"
          :options="trustedCertificateOptions"
          optionLabel="name"
          optionValue="value"
          class="w-full md:w-14rem"
          placeholder=""
          :disabled="!enableMutualAuthentication"
        />
      </div> -->
    </template>
  </CreateFormBlock>
</template>

<script>
  import CreateFormBlock from '@/templates/create-form-block'
  import InputText from 'primevue/inputtext'
  import Dropdown from 'primevue/dropdown'
  import PrimeTextarea from 'primevue/textarea'
  import InputSwitch from 'primevue/inputswitch'
  // import RadioButton from 'primevue/radiobutton'
  import { useField, useForm } from 'vee-validate'
  import * as yup from 'yup'

  const EDGE_CERTIFICATE_OPTIONS = [
    { name: 'Azion (SAN)', value: 'azion', selected: true },
    { name: "Let' Encrypt (Beta)", value: 'encrypt' }
  ]

  export default {
    components: {
      CreateFormBlock,
      InputText,
      Dropdown,
      PrimeTextarea,
      InputSwitch
      // RadioButton
    },
    props: {
      createDomainService: Function,
      listDigitalCertificatesService: Function,
      listEdgeApplicationsService: Function
    },
    data() {
      return {
        edgeCertificateOptions: EDGE_CERTIFICATE_OPTIONS,
        verificationOptions: [
          { name: 'Enforce', value: 'enforce' },
          { name: 'Permissive', value: 'permissive' }
        ],
        trustedCertificateOptions: [],
        edgeApps: [],
        cnamesText: ''
      }
    },
    async created() {
      this.edgeApps = await this.listEdgeApplicationsService({})
      // const response = await this.listDigitalCertificatesService()
      // console.log(response)
    },
    computed: {
      edgeApplicationOptions() {
        return this.edgeApps.map((edgeApp) => ({ name: edgeApp.name, value: edgeApp.id }))
      }
    },
    watch: {
      cnamesText(newValue) {
        const value = newValue.split('\n').filter((item) => item !== '')
        this.setCnames(value)
      }
    },
    setup() {
      const validationSchema = yup.object({
        name: yup.string().required(),
        // edgeCertificate: yup
        //   .string()
        //   .required()
        //   .oneOf(EDGE_CERTIFICATE_OPTIONS.map((option) => option.value)),
        cnames: yup.array().required(),
        cname_access_only: yup.boolean(),
        // enableMutualAuthentication: yup.boolean(),
        // verification: yup.string()
        edge_application_id: yup.number()
      })

      const { errors, defineInputBinds, meta, resetForm, values } = useForm({
        validationSchema,
        initialValues: {
          cnames: [],
          cname_access_only: true,
          edge_application_id: null
        }
      })

      // const { value: edgeCertificate } = useField('edgeCertificate')
      const { value: cnames, setValue: setCnames } = useField('cnames')
      const { value: cnameAccessOnly } = useField('cname_access_only')
      const { value: edgeApplication } = useField('edge_application_id')

      // const { value: enableMutualAuthentication } = useField('enableMutualAuthentication')
      // const { value: verification } = useField('verification')
      // const { value: trustedCertificate } = useField('trustedCertificate')

      const name = defineInputBinds('name', { validateOnInput: true })

      return {
        name,
        // edgeCertificate,
        cnames,
        cnameAccessOnly,
        edgeApplication,
        setCnames,
        // enableMutualAuthentication,
        // verification,
        // trustedCertificate,
        errors,
        meta,
        resetForm,
        values
      }
    }
  }
</script>
