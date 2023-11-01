<template>
  <CreateFormBlock
    pageTitle="Create Digital Certificate"
    :createService="createServiceBySelectedType"
    :formData="values"
    :isValid="meta.valid"
    :cleanFormCallback="resetForm"
  >
    <template #form>
      <FormHorizontal title="General"
      description="Espaço livre para descrição e instruções de preenchimento. Esse conteúdo deve ser criado pensando tanto em funcionalidade quanto em em alinhamento e estética. Devemos sempre criar os blocos conforme o contexto, cuidando sempre para não ter blocos muito longos."
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="name"
              class="text-color text-base font-medium"
              >Name *</label
            >
            <InputText
              placeholder="Insert the Digital Certificate name"
              v-bind="digitalCertificateName"
              type="text"
              id="name"
              :class="{ 'p-invalid': errors.digitalCertificateName }"
              v-tooltip.top="{ value: errors.digitalCertificateName, showDelay: 200 }"
            />
            <small
              v-if="errors.digitalCertificateName"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.digitalCertificateName }}</small
            >
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-3">
            <Card
               :pt="{
                 body: { class: 'p-4' },
                 title: { class: 'flex justify-between  text-base m-0 font-medium' },
                 subtitle: { class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]' }
               }"
             >
               <template #title>
                 <span class="text-base">Edge Certificate</span>
                 <RadioButton
                  v-model="certificateType"
                  inputId="certificateType1"
                  name="certificateType"
                  :value="certificateTypes.EDGE_CERTIFICATE"
                 />
               </template>
             </Card>
             <Card
               :pt="{
                 body: { class: 'p-4' },
                 title: { class: 'flex justify-between  text-base m-0 font-medium' },
                 subtitle: { class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]' }
               }"
             >
               <template #title>
                 <span class="text-base">Trusted CA Certificate</span>
                 <RadioButton
                  v-model="certificateType"
                  inputId="certificateType2"
                  name="certificateType"
                  :value="certificateTypes.TRUSTED"
                 />
               </template>
             </Card>
          </div>
        </template>
      </FormHorizontal>
      <FormHorizontal 
      title="Edge Certificate Type"
      description="Espaço livre para descrição e instruções de preenchimento. Esse conteúdo deve ser criado pensando tanto em funcionalidade quanto em em alinhamento e estética. Devemos sempre criar os blocos conforme o contexto, cuidando sempre para não ter blocos muito longos."
      v-if="certificateType === certificateTypes.EDGE_CERTIFICATE"
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-3">
            <Card
               :pt="{
                 body: { class: 'p-4' },
                 title: { class: 'flex justify-between  text-base m-0 font-medium' },
                 subtitle: { class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]' }
               }"
             >
               <template #title>
                 <span class="text-base">Upload my certificate and private key</span>
                 <RadioButton
                  v-model="createCertificateType"
                  inputId="createCertificateType1"
                  name="createCertificateType"
                  :value="edgeCertificateTypes.UPLOAD"
                 />
               </template>
             </Card>
             <Card
               :pt="{
                 body: { class: 'p-4' },
                 title: { class: 'flex justify-between  text-base m-0 font-medium' },
                 subtitle: { class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]' }
               }"
             >
               <template #title>
                 <span class="text-base">Generate CSR and private key with Azion</span>
                 <RadioButton
                  v-model="createCertificateType"
                  inputId="createCertificateType2"
                  name="createCertificateType"
                  :value="edgeCertificateTypes.CSR"
                 />
               </template>
             </Card>
          </div>
        </template>
      </FormHorizontal>
      <FormHorizontal 
        v-if="createCertificateType === edgeCertificateTypes.UPLOAD && certificateType === certificateTypes.EDGE_CERTIFICATE"
        title="Use my certificate and private key"
        description="To upload your Digital Certificate to Azion servers, copy and paste your certificate and private key inside the fields below."
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Certificate:</label>
              <PrimeTextarea
                v-bind="certificate"
                :class="{ 'p-invalid': errors.certificate }"
                v-tooltip.top="{ value: errors.certificate, showDelay: 200 }"
                placeholder="---BEGIN CERTIFICATE---"
                rows="5"
                cols="30"
              />
              <small
              v-if="errors.certificate"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.certificate }}</small
              >
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Private key:</label>
            <PrimeTextarea
              v-model="privateKey"
              :class="{ 'p-invalid': errors.privateKey }"
              v-tooltip.top="{ value: errors.privateKey, showDelay: 200 }"
              placeholder="---BEGIN PRIVATE KEY---"
              rows="5"
              cols="30"
            />
            <small
              v-if="errors.privateKey"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.privateKey }}</small
            >
          </div>
        </template>
      </FormHorizontal>
      <FormHorizontal
        title="Generating a Certificate Signing Request (CSR) with Azion"
        description="A Certificate Signing Request (CSR) is one of the first steps towards getting your own SSL/TLS certificate."
        v-if="createCertificateType === edgeCertificateTypes.CSR  && certificateType === certificateTypes.EDGE_CERTIFICATE"
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Common Name: *</label>
            <InputText
              placeholder="example.com"
              v-bind="common"
              type="text"
              :class="{ 'p-invalid': errors.common }"
              v-tooltip.top="{ value: errors.common, showDelay: 200 }"
            />
            <small
              v-if="errors.common"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.common }}</small
            >
  
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Country / Region: *</label>
            <InputText
              v-bind="country"
              type="text"
              :class="{ 'p-invalid': errors.country }"
              v-tooltip.top="{ value: errors.country, showDelay: 200 }"
            />
            <small
              v-if="errors.country"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.country }}</small
            >
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>State / Province: *</label>
            <InputText
              v-bind="state"
              type="text"
              :class="{ 'p-invalid': errors.state }"
              v-tooltip.top="{ value: errors.state, showDelay: 200 }"
            />
            <small
              v-if="errors.state"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.state }}</small
            >
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>City / Locality: *</label>
            <InputText
              v-bind="city"
              type="text"
              :class="{ 'p-invalid': errors.city }"
              v-tooltip.top="{ value: errors.city, showDelay: 200 }"
            />
            <small
              v-if="errors.city"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.city }}</small
            >
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Organization: *</label>
            <InputText
              v-bind="organization"
              type="text"
              :class="{ 'p-invalid': errors.organization }"
              v-tooltip.top="{ value: errors.organization, showDelay: 200 }"
            />
            <small
              v-if="errors.organization"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.organization }}</small
            >
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Organization Unit: *</label>
            <InputText
              v-bind="organizationUnity"
              type="text"
              :class="{ 'p-invalid': errors.organizationUnity }"
              v-tooltip.top="{ value: errors.organizationUnity, showDelay: 200 }"
            />
            <small
              v-if="errors.organizationUnity"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.organizationUnity }}</small
            >
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">       
            <label>Email: *</label>
            <InputText
              v-bind="email"
              type="text"
              :class="{ 'p-invalid': errors.email }"
              v-tooltip.top="{ value: errors.email, showDelay: 200 }"
            />
            <small
              v-if="errors.email"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.email }}</small
            >
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Private Key Type: *</label>
            <InputText
              v-bind="privateKeyType"
              type="text"
              disabled
              :class="{ 'p-invalid': errors.privateKeyType }"
              v-tooltip.top="{ value: errors.privateKeyType, showDelay: 200 }"
            />
            <small
              v-if="errors.privateKeyType"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.privateKeyType }}</small
            >
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Subject Alternative Names (SAN):</label>
            <PrimeTextarea
              v-bind="subjectAlternativeNames"
              :class="{ 'p-invalid': errors.subjectAlternativeNames }"
              v-tooltip.top="{ value: errors.subjectAlternativeNames, showDelay: 200 }"
              placeholder="www.example.com
example.net
mail.example.com
support.example.com"
              rows="5"
              cols="30"
            />
            <small
              v-if="errors.subjectAlternativeNames"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.subjectAlternativeNames }}</small
            >
          </div>
        </template>
      </FormHorizontal>
      <FormHorizontal
        title="Use my Trusted CA Certificate"
        description="Trusted Certificate Authority Certificate can be used for Mutual Transport Layer Security (mTLS) configuration on Domains. To upload your Trusted CA Certificate to Azion servers, copy your certificate code and
        paste it inside the field below."
        v-if="certificateType === certificateTypes.TRUSTED"
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Certificate:</label>
            <PrimeTextarea
              v-bind="certificate"
              :class="{ 'p-invalid': errors.certificate }"
              v-tooltip.top="{ value: errors.certificate, showDelay: 200 }"
              placeholder="---BEGIN CERTIFICATE---"
              rows="5"
              cols="30"
            />
            <small>Tip: It's possible to include intermediate certificates.</small>
            <small
              v-if="errors.certificate"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.certificate }}</small
            >
          </div>
        </template>
      </FormHorizontal>
    </template>
  </CreateFormBlock>
</template>

<script>
  import CreateFormBlock from '@/templates/create-form-block-new'
  import Card from 'primevue/card'
  import RadioButton from 'primevue/radiobutton'
  import PrimeTextarea from 'primevue/textarea'
  import InputText from 'primevue/inputtext'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import { ref, watch } from 'vue'

  export default {
    components: {
      CreateFormBlock,
      FormHorizontal,
      RadioButton,
      Card,
      PrimeTextarea,
      InputText
    },
    props: {
      createDigitalCertificatesService: {
        type: Function,
        required: true
      },
      createDigitalCertificatesCSRService: {
        type: Function,
        required: true
      }
    },
    setup(props) {
      const createDigitalCertificate = props.createDigitalCertificatesService
      const createCSR = props.createDigitalCertificatesCSRService
      const createServiceBySelectedType = ref(createDigitalCertificate)

      const edgeCertificateTypes = {
        CSR: 'generateCSR',
        UPLOAD: 'uploadCertificateAndPrivateKey'
      }
      const certificateTypes = {
        EDGE_CERTIFICATE: 'edge_certificate',
        TRUSTED: 'trusted_ca_certificate'
      }

      const CSRRequiredField = {
        is: edgeCertificateTypes.CSR,
        then: (schema) => schema.required('Field Required')
      }
      const certificateRequiredField = (createCertificateType, certificateType) => {
        const isUploadCertificate = createCertificateType === edgeCertificateTypes.UPLOAD
        const isTrustedCA = certificateType === certificateTypes.TRUSTED

        return isUploadCertificate || isTrustedCA
      }

      const validationSchema = yup.object({
        digitalCertificateName: yup.string().required('Name is a required field.'),

        // Certificate Choices
        certificateType: yup.string().required('Certificate Type is required.'),
        createCertificateType: yup.string().required('Certificate Type is a required field.'),

        // Edge Certificate Fields
        certificate: yup.string().when(['createCertificateType', 'certificateType'], {
          is: certificateRequiredField,
          then: (schema) => schema.required('Certificate is a required field.')
        }),
        privateKey: yup.string(),

        // CSR Fields
        common: yup.string().when('createCertificateType', CSRRequiredField),
        state: yup.string().when('createCertificateType', CSRRequiredField),
        city: yup.string().when('createCertificateType', CSRRequiredField),
        organization: yup.string().when('createCertificateType', CSRRequiredField),
        organizationUnity: yup
          .string()
          .when('createCertificateType', CSRRequiredField)
          .label('organization unity'),
        privateKeyType: yup
          .string()
          .when('createCertificateType', CSRRequiredField)
          .label('private key type'),
        subjectAlternativeNames: yup
          .string()
          .when('createCertificateType', CSRRequiredField)
          .label('subject alternative names (SAN)'),
        country: yup.string().when('createCertificateType', {
          is: edgeCertificateTypes.CSR,
          then: (schema) => schema.required('Country is a required field.').max(2, 'Country must be 2 characters.').min(2, 'Country must be 2 characters.')
        }),
        email: yup.string().when('createCertificateType', {
          is: edgeCertificateTypes.CSR,
          then: (schema) => schema.required('Email is a required field.').email()
        })
      })

      const { errors, defineInputBinds, defineComponentBinds, meta, resetForm, values } = useForm({
        validationSchema,
        initialValues: {
          digitalCertificateName: '',

          // Form Choices
          certificateType: certificateTypes.EDGE_CERTIFICATE,
          createCertificateType: edgeCertificateTypes.UPLOAD,

          // Edge Certificate values
          certificate: '',
          privateKey: undefined,

          // CSR values
          common: '',
          country: '',
          state: '',
          city: '',
          organization: '',
          organizationUnity: '',
          email: '',
          privateKeyType: 'RSA (2048)',
          subjectAlternativeNames: ''
        }
      })

      const digitalCertificateName = defineInputBinds('digitalCertificateName', {
        validateOnInput: true
      })
      const certificate = defineComponentBinds('certificate', { validateOnInput: true })
      const { value: privateKey, setValue: setPrivateKeyValue } = useField('privateKey')

      // CSR Binds
      const common = defineInputBinds('common', { validateOnInput: true })
      const country = defineInputBinds('country', { validateOnInput: true })
      const state = defineInputBinds('state', { validateOnInput: true })
      const city = defineInputBinds('city', { validateOnInput: true })
      const organization = defineInputBinds('organization', { validateOnInput: true })
      const organizationUnity = defineInputBinds('organizationUnity', { validateOnInput: true })
      const email = defineInputBinds('email', { validateOnInput: true })
      const privateKeyType = defineInputBinds('privateKeyType', { validateOnInput: true })
      const subjectAlternativeNames = defineComponentBinds('subjectAlternativeNames', {
        validateOnInput: true
      })

      const { value: certificateType } = useField('certificateType')
      const { value: createCertificateType } = useField('createCertificateType')

      watch([certificateType, createCertificateType], () => {
        const isGenerateCSR = createCertificateType.value === edgeCertificateTypes.CSR
        const isEdgeCertificate = certificateType.value === certificateTypes.EDGE_CERTIFICATE

        createServiceBySelectedType.value = createDigitalCertificate

        if (isGenerateCSR && isEdgeCertificate) {
          createServiceBySelectedType.value = createCSR
        }

        if (!isEdgeCertificate) setPrivateKeyValue(undefined)
      })

      watch(privateKey, (privateKeyValue) => {
        if (privateKeyValue === '') setPrivateKeyValue(undefined)
      })

      return {
        createServiceBySelectedType,
        values,
        meta,
        errors,
        resetForm,
        common,
        country,
        state,
        city,
        organization,
        organizationUnity,
        email,
        privateKeyType,
        certificate,
        privateKey,
        certificateType,
        createCertificateType,
        digitalCertificateName,
        subjectAlternativeNames,
        edgeCertificateTypes,
        certificateTypes
      }
    }
  }
</script>
