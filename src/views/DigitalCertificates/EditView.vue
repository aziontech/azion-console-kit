<template>
  <EditFormBlock
    pageTitle="Edit Digital Certificates"
    :editService="editDigitalCertificateService"
    :loadService="loadDigitalCertificateService"
    :initialDataSetter="setValues"
    :isValid="meta.valid"
    :formData="values"
  >
    <template #form>
      <FormHorizontal
        v-if="csr.modelValue"
        title="Generate CSR and private key with Azion"
        description="You've generated a certificate signing request (CSR) with Azion. Copy the CSR and submit it to a certificate authority.
        Once you've received your certificate, paste it in the certificate field and click save."
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Name *</label>
            <InputText
              v-bind="name"
              type="text"
              placeholder="Digital Certificate name"
              :class="{ 'p-invalid': errors.name }"
              v-tooltip.top="{ value: errors.name, showDelay: 200 }"
            />
            <small
              v-if="errors.name"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.name }}</small
            >
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Certificate </label>
            <PrimeTextarea
              v-bind="certificate"
              :class="{ 'p-invalid': errors.certificate }"
              v-tooltip.top="{ value: errors.certificate, showDelay: 200 }"
              placeholder="-----BEGIN CERTIFICATE-----&#10;-----END CERTIFICATE-----"
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
            <label>Certificate Signing Request (CSR) </label>
            <PrimeTextarea
              v-bind="csr"
              :class="{ 'p-invalid': errors.csr }"
              v-tooltip.top="{ value: errors.csr, showDelay: 200 }"
              placeholder="-----BEGIN CERTIFICATE REQUEST-----&#10;-----END CERTIFICATE REQUEST-----"
              rows="5"
              cols="30"
            />
            <small
              v-if="errors.csr"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.csr }}</small
            >
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <PrimeButton
              class="max-sm:w-full"
              type="button"
              severity="secondary"
              :label="'Copy to Clipboard'"
              @click="copyCSRToclipboard"
            />
            <small v-if="csrCopied">Copied successfully!</small>
          </div>
        </template>
      </FormHorizontal>
      <FormHorizontal
        v-if="!csr.modelValue && certificateType === certificateTypes.EDGE_CERTIFICATE"
        title="Upload certificate and private key"
        description="To update your digital certificate, copy and paste your certificate and private key codes in the respective fields,
        including the begin and end tags."
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Name *</label>
            <InputText
              v-bind="name"
              type="text"
              placeholder="Digital Certificate name"
              :class="{ 'p-invalid': errors.name }"
              v-tooltip.top="{ value: errors.name, showDelay: 200 }"
            />
            <small
              v-if="errors.name"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.name }}</small
            >
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Certificate </label>
            <PrimeTextarea
              v-bind="certificate"
              :class="{ 'p-invalid': errors.certificate }"
              v-tooltip.top="{ value: errors.certificate, showDelay: 200 }"
              placeholder="For security reasons, the certificate cannot be shown.&#10;To replace your digital certificate, paste the new certificate here."
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
            <label>Private key </label>
            <PrimeTextarea
              v-model="privateKey"
              :class="{ 'p-invalid': errors.privateKey }"
              v-tooltip.top="{ value: errors.privateKey, showDelay: 200 }"
              placeholder="For security reasons, the private key cannot be shown.&#10;To replace your digital certificate, paste the new private key here."
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
        v-if="certificateType === certificateTypes.TRUSTED"
        title="Upload Trusted CA Certificate"
        description="A Trusted Certificate Authority (CA) certificate can be used for Mutual Transport Layer Security (mTLS) configuration. To update your Trusted CA Certificate to Azion, paste your certificate code in the respective field."
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Certificate Name *</label>
            <InputText
              v-bind="name"
              type="text"
              placeholder="Insert the Digital Certificate name"
              :class="{ 'p-invalid': errors.name }"
              v-tooltip.top="{ value: errors.name, showDelay: 200 }"
            />
            <small
              v-if="errors.name"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.name }}</small
            >
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Certificate </label>
            <PrimeTextarea
              v-bind="certificate"
              :class="{ 'p-invalid': errors.certificate }"
              v-tooltip.top="{ value: errors.certificate, showDelay: 200 }"
              placeholder="For security reasons, the certificate cannot be shown.&#10;Paste a new certificate in this field to update it."
              rows="5"
              cols="30"
            />
            <small>You can include intermediate certificates.</small>
            <small
              v-if="errors.certificate"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.certificate }}</small
            >
          </div>
        </template>
      </FormHorizontal>
    </template>
  </EditFormBlock>
</template>

<script>
  import EditFormBlock from '@/templates/edit-form-block-new'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import PrimeTextarea from 'primevue/textarea'
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import { ref, watch } from 'vue'

  export default {
    components: {
      EditFormBlock,
      PrimeTextarea,
      InputText,
      PrimeButton,
      FormHorizontal
    },
    props: {
      loadDigitalCertificateService: {
        type: Function,
        required: true
      },
      editDigitalCertificateService: {
        type: Function,
        required: true
      }
    },
    setup() {
      const edgeCertificateTypes = {
        CSR: 'generateCSR',
        UPLOAD: 'uploadCertificateAndPrivateKey'
      }
      const certificateTypes = {
        EDGE_CERTIFICATE: 'edge_certificate',
        TRUSTED: 'trusted_ca_certificate'
      }

      const validationSchema = yup.object({
        name: yup.string().required('Name is a required field.'),
        certificateType: yup.string(),
        csr: yup.string(),
        certificate: yup.string(),
        privateKey: yup.string()
      })

      const { setValues, errors, defineInputBinds, defineComponentBinds, meta, resetForm, values } =
        useForm({
          validationSchema
        })

      const name = defineInputBinds('name', { validateOnInput: true })
      const certificate = defineComponentBinds('certificate', { validateOnInput: true })
      const csr = defineComponentBinds('csr')

      const { value: certificateType } = useField('certificateType')
      const { value: createCertificateType } = useField('createCertificateType')
      const { value: privateKey, setValue: setPrivateKeyValue } = useField('privateKey')

      watch(privateKey, (privateKeyValue) => {
        if (privateKeyValue === '') setPrivateKeyValue(undefined)
      })

      const csrCopied = ref(false)
      function copyCSRToclipboard() {
        navigator.clipboard.writeText(csr.value.modelValue).then(() => {
          csrCopied.value = true
        })
      }

      return {
        errors,
        meta,
        resetForm,
        values,
        setValues,
        certificate,
        certificateType,
        createCertificateType,
        name,
        csr,
        edgeCertificateTypes,
        certificateTypes,
        copyCSRToclipboard,
        csrCopied,
        privateKey
      }
    }
  }
</script>
