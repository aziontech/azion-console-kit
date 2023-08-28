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
            v-bind="certificateType"
            inputId="certificateType1"
            name="certificateType"
            value="edge_certificate"
          />
          <label for="certificateType1" class="ml-2">Edge Certificate</label>
        </div>
        <div class="flex align-items-center">
          <RadioButton
            v-bind="certificateType"
            inputId="certificateType2"
            name="certificateType"
            value="trusted_ca_certificate"
          />
          <label for="certificateType2" class="ml-2">Trusted CA Certificate</label>
        </div>
      </div>

      <hr />

      <!-- Edge Certificate Form -->
      <template v-if="certificateType.modelValue === 'edge_certificate'">
        <b>Digital Certificates</b>
        <div class="flex flex-wrap gap-3">
          <div class="flex align-items-center">
            <RadioButton
              v-bind="createCertificateType"
              inputId="createCertificateType1"
              name="createCertificateType"
              value="uploadCertificateAndPrivateKey"
            />
            <label for="certificateType1" class="ml-2">Upload my certificate and private key</label>
          </div>
          <div class="flex align-items-center">
            <RadioButton
              v-bind="createCertificateType"
              inputId="createCertificateType2"
              name="createCertificateType"
              value="generateCSR"
            />
            <label for="createCertificateType2" class="ml-2"
              >Generate CSR and private key with Azion</label
            >
          </div>
        </div>

        <!-- Upload certificate form -->
        <template v-if="createCertificateType.modelValue === 'uploadCertificateAndPrivateKey'">
          <b>Use my certificate and private key</b>
          <p>
            To upload your Digital Certificate to Azion servers, copy and paste your certificate and
            private key inside the fields below.
          </p>

          <label>Certificate:</label>
          <Textarea
            v-bind="certificateFields.certificate"
            :class="{ 'p-invalid': errors.certificate }"
            v-tooltip.top="errors.certificate"
            placeholder="---BEGIN CERTIFICATE---"
            rows="5"
            cols="30"
          />

          <label>Private key:</label>
          <Textarea
            v-bind="certificateFields.privateKey"
            :class="{ 'p-invalid': errors.privateKey }"
            v-tooltip.top="errors.privateKey"
            placeholder="---BEGIN PRIVATE KEY---"
            rows="5"
            cols="30"
          />
        </template>

        <!-- Generate CSR form -->
        <template v-if="createCertificateType.modelValue === 'generateCSR'">
          <b>Generating a Certificate Signing Request (CSR) with Azion</b>
          <p>
            A Certificate Signing Request (CSR) is one of the first steps towards getting your own
            SSL/TLS certificate.
          </p>

          <label>Common Name: *</label>
          <InputText
            placeholder="example.com"
            v-bind="generateCSRFields.common"
            type="text"
            :class="{ 'p-invalid': errors.common }"
            v-tooltip.top="errors.common"
          />

          <label>Country / Region: *</label>
          <InputText
            v-bind="generateCSRFields.country"
            type="text"
            :class="{ 'p-invalid': errors.country }"
            v-tooltip.top="errors.country"
          />

          <label>State / Province: *</label>
          <InputText
            v-bind="generateCSRFields.state"
            type="text"
            :class="{ 'p-invalid': errors.state }"
            v-tooltip.top="errors.state"
          />

          <label>City / Locality: *</label>
          <InputText
            v-bind="generateCSRFields.city"
            type="text"
            :class="{ 'p-invalid': errors.city }"
            v-tooltip.top="errors.city"
          />

          <label>Organization: *</label>
          <InputText
            v-bind="generateCSRFields.organization"
            type="text"
            :class="{ 'p-invalid': errors.organization }"
            v-tooltip.top="errors.organization"
          />

          <label>Organization Unit: *</label>
          <InputText
            v-bind="generateCSRFields.organizationUnity"
            type="text"
            :class="{ 'p-invalid': errors.organizationUnity }"
            v-tooltip.top="errors.organizationUnity"
          />

          <label>Email: *</label>
          <InputText
            v-bind="generateCSRFields.email"
            type="text"
            :class="{ 'p-invalid': errors.email }"
            v-tooltip.top="errors.email"
          />

          <label>Private Key Type: *</label>
          <InputText
            v-bind="generateCSRFields.privateKeyType"
            type="text"
            disabled
            :class="{ 'p-invalid': errors.privateKeyType }"
            v-tooltip.top="errors.privateKeyType"
          />

          <label>Subject Alternative Names (SAN):</label>
          <Textarea
            v-bind="generateCSRFields.subjectAlternativeNames"
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
      <template v-if="certificateType.modelValue === 'trusted_ca_certificate'">
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
        <Textarea
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

<script setup>
import CreateFormBlock from '@/templates/create-form-block'
import RadioButton from 'primevue/radiobutton'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import { useForm } from 'vee-validate'
import * as yup from 'yup'
import { ref, watch } from 'vue'

const props = defineProps({
  createDigitalCertificatesService: {
    required: true
  }
})

const createDigitalCertificate = props.createDigitalCertificatesService.createDigitalCertificate
const createCSR = props.createDigitalCertificatesService.createCSR
const createServiceBySelectedType = ref(createDigitalCertificate)

const schemaInitial = yup.object({
  certificateType: yup.string(),
  createCertificateType: yup.string(),
  digitalCertificateName: yup.string().required()
})

const formValidate = useForm({
  validationSchema: schemaInitial,
  initialValues: {
    certificateType: 'edge_certificate',
    createCertificateType: 'uploadCertificateAndPrivateKey'
  }
})
var defineComponentBinds = formValidate.defineComponentBinds
var resetForm = formValidate.resetForm
var errors = formValidate.errors
var meta = formValidate.meta
var values = formValidate.values

let certificateType = '';
let createCertificateType = '';

let digitalCertificateName = '';
const certificateFields = ref({})
const generateCSRFields = ref({})

setInitialState()
function setInitialState() {
  setCertificateForm()
  certificateType = defineComponentBinds('certificateType')
  createCertificateType = defineComponentBinds('createCertificateType')
}
function setGenerateCSRForm() {
  const schemaCSR = yup.object({
    digitalCertificateName: yup.string().required(),

    //GenerateCSR fields validation
    common: yup.string().required(),
    country: yup.string().required(),
    state: yup.string().required(),
    city: yup.string().required(),
    organization: yup.string().required(),
    organizationUnity: yup.string().required(),
    email: yup.string().required().email(),
    privateKeyType: yup.string().required(),
  })

  const formValidateCSR = useForm({
    validationSchema: schemaCSR,
    initialValues: {
      privateKeyType: 'RSA (2048)',
      digitalCertificateName: digitalCertificateName.value.modelValue,
    }
  })

  defineComponentBinds = formValidateCSR.defineComponentBinds
  resetForm = formValidateCSR.resetForm
  errors = formValidateCSR.errors
  meta = formValidateCSR.meta
  values = formValidateCSR.values

  digitalCertificateName = defineComponentBinds('digitalCertificateName', {
    validateOnInput: true
  })

  // GenerateCSR fields
  generateCSRFields.value = {
    common: defineComponentBinds('common', { validateOnInput: true }),
    country: defineComponentBinds('country', { validateOnInput: true }),
    state: defineComponentBinds('state', { validateOnInput: true }),
    city: defineComponentBinds('city', { validateOnInput: true }),
    organization: defineComponentBinds('organization', { validateOnInput: true }),
    organizationUnity: defineComponentBinds('organizationUnity', { validateOnInput: true }),
    email: defineComponentBinds('email', { validateOnInput: true }),
    privateKeyType: defineComponentBinds('privateKeyType', { validateOnInput: true }),
    subjectAlternativeNames: defineComponentBinds('subjectAlternativeNames', {
      validateOnInput: true
    })
  }
}

function setCertificateForm() {
  const schemaCertificate = yup.object({
    digitalCertificateName: yup.string().required(),
    certificate: yup.string().required(),
    certificateType: yup.string(),
    createCertificateType: yup.string(),
  })

  const formCertificateValidate = useForm({
    validationSchema: schemaCertificate,
    initialValues: {
      certificate: '',
      certificateType: 'edge_certificate',
      digitalCertificateName: digitalCertificateName?.value?.modelValue,
      createCertificateType: 'uploadCertificateAndPrivateKey'
    }
  })

  defineComponentBinds = formCertificateValidate.defineComponentBinds
  resetForm = formCertificateValidate.resetForm
  errors = formCertificateValidate.errors
  meta = formCertificateValidate.meta
  values = formCertificateValidate.values

  certificateFields.value = {
    certificate: defineComponentBinds('certificate'),
    privateKey: defineComponentBinds('privateKey')
  }
  digitalCertificateName = defineComponentBinds('digitalCertificateName', {
    validateOnInput: true
  })
}

watch(createCertificateType, (selectedType) => {
  if (selectedType.modelValue === 'generateCSR') {
    createServiceBySelectedType.value = createCSR
    setGenerateCSRForm()
  } else if (selectedType.modelValue === 'uploadCertificateAndPrivateKey') {
    createServiceBySelectedType.value = createDigitalCertificate
    setCertificateForm()
  }
})
</script>
