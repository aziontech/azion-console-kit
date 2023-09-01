<template>
  <EditFormBlock
    :pageTitle="'Edit Digital Certificates'"
    :editService="editDigitalCertificateService"
    :loadService="loadDigitalCertificateService"
    :initialDataSetter="setValues"
    :isValid="meta.valid"
    :formData="values"
  >
    <template #form>
      <label>Certificate Name: *</label>

      <InputText
        v-bind="name"
        type="text"
        placeholder="Insert the Digital Certificate name"
        :class="{ 'p-invalid': errors.name }"
        v-tooltip.top="errors.name"
      />

      <hr />

      <!-- CSR Certificate Form -->
      <template v-if="csr.modelValue">
        <b>Digital Certificate</b>
        <p>
          To upload your Digital Certificate to Azion servers, copy and paste your certificate
          inside the field below.
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

        <label>Certificate Signing Request (CSR):</label>
        <PrimeTextarea
          v-bind="csr"
          :class="{ 'p-invalid': errors.csr }"
          v-tooltip.top="errors.csr"
          placeholder="---BEGIN CERTIFICATE---"
          rows="5"
          cols="30"
        />

        <PrimeButton
          class="max-sm:w-full"
          type="button"
          severity="secondary"
          :label="'Copy to Clipboard'"
          @click="copyCSRToclipboard"
        />
        <small v-if="csrCopied">Copied successfully!</small>
      </template>

      <!-- Upload Edge Certificate Form -->
      <template v-if="!csr.modelValue && certificateType === certificateTypes.EDGE_CERTIFICATE">
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
          placeholder="For security, the certificate cannot be seen.&#10;Paste your new certificate here to update it."
          rows="5"
          cols="30"
        />

        <label>Private key:</label>
        <PrimeTextarea
          v-model="privateKey"
          :class="{ 'p-invalid': errors.privateKey }"
          v-tooltip.top="errors.privateKey"
          placeholder="For security, the certificate cannot be seen.&#10;Paste your new certificate here to update it."
          rows="5"
          cols="30"
        />
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
          placeholder="For security, the certificate cannot be seen.&#10;Paste your new certificate here to update it."
          rows="5"
          cols="30"
        />
        <small>Tip: It's possible to include intermediate certificates.</small>
      </template>
    </template>
  </EditFormBlock>
</template>

<script>
import EditFormBlock from '@/templates/edit-form-block'
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
    PrimeButton
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
        validationSchema,
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
