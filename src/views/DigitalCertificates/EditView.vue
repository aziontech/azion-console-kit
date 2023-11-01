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
      title="Digital Certificate"
      description="To upload your Digital Certificate to Azion servers, copy and paste your certificate inside the field below."
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Certificate Name: *</label>
            <InputText
              v-bind="name"
              type="text"
              placeholder="Insert the Digital Certificate name"
              :class="{ 'p-invalid': errors.name }"
              v-tooltip.top="{ value: errors.name, showDelay: 200 }"
            />
          </div>
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
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Certificate Signing Request (CSR):</label>
            <PrimeTextarea
              v-bind="csr"
              :class="{ 'p-invalid': errors.csr }"
              v-tooltip.top="{ value: errors.csr, showDelay: 200 }"
              placeholder="---BEGIN CERTIFICATE---"
              rows="5"
              cols="30"
            />
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
      title="Use my certificate and private key"
      description="To upload your Digital Certificate to Azion servers, copy and paste your certificate inside the field below."
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Certificate Name: *</label>
            <InputText
              v-bind="name"
              type="text"
              placeholder="Insert the Digital Certificate name"
              :class="{ 'p-invalid': errors.name }"
              v-tooltip.top="{ value: errors.name, showDelay: 200 }"
            />
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Certificate:</label>
            <PrimeTextarea
              v-bind="certificate"
              :class="{ 'p-invalid': errors.certificate }"
              v-tooltip.top="{ value: errors.certificate, showDelay: 200 }"
              placeholder="For security, the certificate cannot be seen.&#10;Paste your new certificate here to update it."
              rows="5"
              cols="30"
            />
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">    
            <label>Private key:</label>
            <PrimeTextarea
              v-model="privateKey"
              :class="{ 'p-invalid': errors.privateKey }"
              v-tooltip.top="{ value: errors.privateKey, showDelay: 200 }"
              placeholder="For security, the certificate cannot be seen.&#10;Paste your new certificate here to update it."
              rows="5"
              cols="30"
            />
          </div>
        </template>
      </FormHorizontal>
      <FormHorizontal 
      v-if="certificateType === certificateTypes.TRUSTED"
      title="Use my Trusted CA Certificate"
      description="Trusted Certificate Authority Certificate can be used for Mutual Transport Layer Security (mTLS) configuration on Domains. To upload your Trusted CA Certificate to Azion servers, copy your certificate code and paste it inside the field below."
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Certificate Name: *</label>
            <InputText
              v-bind="name"
              type="text"
              placeholder="Insert the Digital Certificate name"
              :class="{ 'p-invalid': errors.name }"
              v-tooltip.top="{ value: errors.name, showDelay: 200 }"
            />
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label>Certificate:</label>
            <PrimeTextarea
              v-bind="certificate"
              :class="{ 'p-invalid': errors.certificate }"
              v-tooltip.top="{ value: errors.certificate, showDelay: 200 }"
              placeholder="For security, the certificate cannot be seen.&#10;Paste your new certificate here to update it."
              rows="5"
              cols="30"
            />
            <small>Tip: It's possible to include intermediate certificates.</small>
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
        name: yup.string().required(),
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
