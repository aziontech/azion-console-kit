<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import PrimeTextarea from 'primevue/textarea'
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import { useField } from 'vee-validate'
  import { ref, watch } from 'vue'

  const props = defineProps({
    clipboardWrite: {
      type: Function,
      required: true
    }
  })

  const certificateTypes = {
    EDGE_CERTIFICATE: 'edge_certificate',
    TRUSTED: 'trusted_ca_certificate'
  }

  const csrCopied = ref(false)

  const { value: name, errorMessage: nameError } = useField('name')
  const { value: certificate, errorMessage: certificateError } = useField('certificate')
  const { value: csr, errorMessage: csrError } = useField('csr')
  const { value: certificateType } = useField('certificateType')
  const {
    value: privateKey,
    errorMessage: privateKeyError,
    setValue: setPrivateKeyValue
  } = useField('privateKey')

  async function copyCSRToclipboard() {
    await props.clipboardWrite(csr.value)
    csrCopied.value = true
  }

  watch(privateKey, (privateKeyValue) => {
    if (privateKeyValue === '') setPrivateKeyValue(undefined)
  })
</script>

<template>
  <FormHorizontal
    v-if="csr"
    title="Update CSR"
    description="Submit the CSR to a certificate authority. Once the certificate is signed,
        paste the PEM-encoded certificate in the respective field."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>Name *</label>
        <InputText
          v-model="name"
          type="text"
          placeholder="My digital certificate"
          :class="{ 'p-invalid': nameError }"
        />
        <small
          v-if="nameError"
          class="p-error text-xs font-normal leading-tight"
          >{{ nameError }}</small
        >
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>Certificate </label>
        <PrimeTextarea
          v-model="certificate"
          :class="{ 'p-invalid': certificateError }"
          placeholder="-----BEGIN CERTIFICATE-----&#10;-----END CERTIFICATE-----"
          rows="5"
          cols="30"
        />
        <small
          v-if="certificateError"
          class="p-error text-xs font-normal leading-tight"
          >{{ certificateError }}</small
        >
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>Certificate Signing Request (CSR) </label>
        <PrimeTextarea
          disabled
          v-model="csr"
          :class="{ 'p-invalid': csrError }"
          placeholder="-----BEGIN CERTIFICATE REQUEST-----&#10;-----END CERTIFICATE REQUEST-----"
          rows="5"
          cols="30"
        />
        <small
          v-if="csrError"
          class="p-error text-xs font-normal leading-tight"
          >{{ csrError }}</small
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
    v-if="!csr && certificateType === certificateTypes.EDGE_CERTIFICATE"
    title="Update a Server Certificate"
    description="Paste the PEM-encoded TLS X.509 certificate and private key in the respective fields to update the certificate. The current certificate and private key are hidden to protect sensitive information."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>Name *</label>
        <InputText
          v-model="name"
          type="text"
          placeholder="My digital certificate"
          :class="{ 'p-invalid': nameError }"
        />
        <small
          v-if="nameError"
          class="p-error text-xs font-normal leading-tight"
          >{{ nameError }}</small
        >
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>Certificate </label>
        <PrimeTextarea
          v-model="certificate"
          :class="{ 'p-invalid': certificateError }"
          placeholder="-----BEGIN CERTIFICATE-----&#10;-----END CERTIFICATE-----"
          rows="5"
          cols="30"
        />
        <small
          v-if="certificateError"
          class="p-error text-xs font-normal leading-tight"
          >{{ certificateError }}</small
        >
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>Private key </label>
        <PrimeTextarea
          v-model="privateKey"
          :class="{ 'p-invalid': privateKeyError }"
          placeholder="-----BEGIN PRIVATE KEY-----&#10;-----END PRIVATE KEY-----"
          rows="5"
          cols="30"
        />
        <small
          v-if="privateKeyError"
          class="p-error text-xs font-normal leading-tight"
          >{{ privateKeyError }}</small
        >
      </div>
    </template>
  </FormHorizontal>

  <!-- Trusted case -->
  <FormHorizontal
    v-if="certificateType === certificateTypes.TRUSTED"
    title="Update Trusted CA Certificate"
    description="Paste the PEM-encoded Trusted CA certificate in the respective field to update the certificate. The current certificate is hidden to protect sensitive information."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>Name *</label>
        <InputText
          v-model="name"
          type="text"
          :class="{ 'p-invalid': nameError }"
        />
        <small
          v-if="nameError"
          class="p-error text-xs font-normal leading-tight"
          >{{ nameError }}</small
        >
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>Certificate </label>
        <PrimeTextarea
          v-model="certificate"
          :class="{ 'p-invalid': certificateError }"
          placeholder="-----BEGIN CERTIFICATE----&#10;-----END CERTIFICATE-----"
          rows="5"
          cols="30"
        />
        <small class="text-color-secondary text-xs font-normal leading-tight"
          >Intermediate certificates are accepted.</small
        >
        <small
          v-if="certificateError"
          class="p-error text-xs font-normal leading-tight"
          >{{ certificateError }}</small
        >
      </div>
    </template>
  </FormHorizontal>
</template>
