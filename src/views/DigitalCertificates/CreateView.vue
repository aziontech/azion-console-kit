<template>
  <CreateFormBlock
    :pageTitle="'Create Digital Certificate'"
    :createService="createServiceBySelectedType"
    :formData="values"
    :isValid="meta.valid"
    :cleanFormCallback="resetForm"
  >
    <template #form>
      <label>Certificate Name: *</label>
      <InputText
        v-bind="digitalCertificateName"
        type="text"
        placeholder="Insert the Digital Certificate name"
        :class="{ 'p-invalid': errors.digitalCertificateName }"
        v-tooltip.top="errors.digitalCertificateName"
      />
      <div class="flex flex-wrap gap-3">
        <div class="flex align-items-center">
          <RadioButton
            v-model="certificateType"
            inputId="certificateType1"
            name="certificateType"
            :value="certificateTypes.EDGE_CERTIFICATE"
          />
          <label for="certificateType1" class="ml-2">Edge Certificate</label>
        </div>
        <div class="flex align-items-center">
          <RadioButton
            v-model="certificateType"
            inputId="certificateType2"
            name="certificateType"
            :value="certificateTypes.TRUSTED"
          />
          <label for="certificateType2" class="ml-2">Trusted CA Certificate</label>
        </div>
      </div>

      <hr />

      <!-- Edge Certificate Form -->
      <template v-if="certificateType === certificateTypes.EDGE_CERTIFICATE">
        <b>Digital Certificates</b>
        <div class="flex flex-wrap gap-3">
          <div class="flex align-items-center">
            <RadioButton
              v-model="createCertificateType"
              inputId="createCertificateType1"
              name="createCertificateType"
              :value="edgeCertificateTypes.UPLOAD"
            />
            <label for="certificateType1" class="ml-2">Upload my certificate and private key</label>
          </div>
          <div class="flex align-items-center">
            <RadioButton
              v-model="createCertificateType"
              inputId="createCertificateType2"
              name="createCertificateType"
              :value="edgeCertificateTypes.CSR"
            />
            <label for="createCertificateType2" class="ml-2"
              >Generate CSR and private key with Azion</label
            >
          </div>
        </div>

        <!-- Upload certificate form -->
        <template v-if="createCertificateType === edgeCertificateTypes.UPLOAD">
          <b>Use my certificate and private key</b>
          <p>
            To upload your Digital Certificate to Azion servers, copy and paste your certificate and
            private key inside the fields below.
          </p>

          <label>Certificate:</label>
          <PrimeTextarea
            v-bind="certificate"
            :class="{ 'p-invalid': errors.certificate }"
            v-tooltip.top="errors.certificate"
            placeholder="---BEGIN CERTIFICATE---"
            rows="5"
            cols="30"
          />

          <label>Private key:</label>
          <PrimeTextarea
            v-model="privateKey"
            :class="{ 'p-invalid': errors.privateKey }"
            v-tooltip.top="errors.privateKey"
            placeholder="---BEGIN PRIVATE KEY---"
            rows="5"
            cols="30"
          />
        </template>

        <!-- Generate CSR form -->
        <template v-if="createCertificateType === edgeCertificateTypes.CSR">
          <b>Generating a Certificate Signing Request (CSR) with Azion</b>
          <p>
            A Certificate Signing Request (CSR) is one of the first steps towards getting your own
            SSL/TLS certificate.
          </p>

          <label>Common Name: *</label>
          <InputText
            placeholder="example.com"
            v-bind="common"
            type="text"
            :class="{ 'p-invalid': errors.common }"
            v-tooltip.top="errors.common"
          />

          <label>Country / Region: *</label>
          <InputText
            v-bind="country"
            type="text"
            :class="{ 'p-invalid': errors.country }"
            v-tooltip.top="errors.country"
          />

          <label>State / Province: *</label>
          <InputText
            v-bind="state"
            type="text"
            :class="{ 'p-invalid': errors.state }"
            v-tooltip.top="errors.state"
          />

          <label>City / Locality: *</label>
          <InputText
            v-bind="city"
            type="text"
            :class="{ 'p-invalid': errors.city }"
            v-tooltip.top="errors.city"
          />

          <label>Organization: *</label>
          <InputText
            v-bind="organization"
            type="text"
            :class="{ 'p-invalid': errors.organization }"
            v-tooltip.top="errors.organization"
          />

          <label>Organization Unit: *</label>
          <InputText
            v-bind="organizationUnity"
            type="text"
            :class="{ 'p-invalid': errors.organizationUnity }"
            v-tooltip.top="errors.organizationUnity"
          />

          <label>Email: *</label>
          <InputText
            v-bind="email"
            type="text"
            :class="{ 'p-invalid': errors.email }"
            v-tooltip.top="errors.email"
          />

          <label>Private Key Type: *</label>
          <InputText
            v-bind="privateKeyType"
            type="text"
            disabled
            :class="{ 'p-invalid': errors.privateKeyType }"
            v-tooltip.top="errors.privateKeyType"
          />

          <label>Subject Alternative Names (SAN):</label>
          <PrimeTextarea
            v-bind="subjectAlternativeNames"
            :class="{ 'p-invalid': errors.subjectAlternativeNames }"
            v-tooltip.top="errors.subjectAlternativeNames"
            placeholder="www.example.com
example.net
mail.example.com
support.example.com"
            rows="5"
            cols="30"
          />
        </template>
      </template>

      <!-- Trusted CA Certificate Form -->
      <template v-if="certificateType === certificateTypes.TRUSTED">
        <b>Use my Trusted CA Certificate</b>
        <p>
          Trusted Certificate Authority Certificate can be used for Mutual Transport Layer Security
          (mTLS) configuration on Domains.
        </p>
        <p>
          To upload your Trusted CA Certificate to Azion servers, copy your certificate code and
          paste it inside the field below.
        </p>

        <label>Certificate:</label>
        <PrimeTextarea
          v-bind="certificate"
          :class="{ 'p-invalid': errors.certificate }"
          v-tooltip.top="errors.certificate"
          placeholder="---BEGIN CERTIFICATE---"
          rows="5"
          cols="30"
        />
        <small>Tip: It's possible to include intermediate certificates.</small>
      </template>
    </template>
  </CreateFormBlock>

</template>

<script>
import CreateFormBlock from '@/templates/create-form-block'
import RadioButton from 'primevue/radiobutton'
import PrimeTextarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import { ref, watch } from 'vue'

export default {
  components: {
    CreateFormBlock,
    RadioButton,
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
      then: (schema) => schema.required()
    }
    const certificateRequiredField = (createCertificateType, certificateType) => {
      const isUploadCertificate = createCertificateType === edgeCertificateTypes.UPLOAD
      const isTrustedCA = certificateType === certificateTypes.TRUSTED

      return isUploadCertificate || isTrustedCA
    }

    const validationSchema = yup.object({
      digitalCertificateName: yup.string().required(),

      // Certificate Choices
      certificateType: yup.string().required(),
      createCertificateType: yup.string().required(),

      // Edge Certificate Fields
      certificate: yup.string().when(['createCertificateType', 'certificateType'], {
        is: certificateRequiredField,
        then: (schema) => schema.required()
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
        then: (schema) => schema.required().max(2).min(2)
      }),
      email: yup.string().when('createCertificateType', {
        is: edgeCertificateTypes.CSR,
        then: (schema) => schema.required().email()
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
      certificateTypes,
    }
  }
}
</script>
