<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import PrimeButton from 'primevue/button'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'

  import { useField } from 'vee-validate'
  import { ref, watch, computed } from 'vue'
  import Divider from 'primevue/divider'

  const props = defineProps({
    clipboardWrite: {
      type: Function,
      required: true
    },
    documentationService: {
      type: Function,
      required: true
    }
  })

  const certificateTypes = {
    EDGE_CERTIFICATE: 'edge_certificate',
    TRUSTED: 'trusted_ca_certificate'
  }

  const csrCopied = ref(false)

  const { value: name } = useField('name')
  const { value: certificate } = useField('certificate')
  const { value: csr } = useField('csr')
  const { value: certificateType } = useField('certificateType')
  const { value: privateKey, setValue: setPrivateKeyValue } = useField('privateKey')

  async function copyCSRToclipboard() {
    await props.clipboardWrite(csr.value)
    csrCopied.value = true
  }

  const openDocumentation = async () => {
    props.documentationService()
  }

  watch(privateKey, (privateKeyValue) => {
    if (privateKeyValue === '') setPrivateKeyValue(undefined)
  })

  const isCertificateType = computed(() => {
    return {
      edgeCertificate: !csr.value && certificateType.value === certificateTypes.EDGE_CERTIFICATE,
      trustedCertificate: certificateType.value === certificateTypes.TRUSTED
    }
  })
</script>

<template>
  <template v-if="managed">
    <FormHorizontal title="Let's encrypt certificate">
      <template #description>
        <p>This is a Let's Encrypt™ certificate automatically created and managed by Azion.</p>

        <p>
          Azion's Certificate Manager is currently verifying if the Domain is correctly pointed by
          CNAME in the DNS.
        </p>

        <Divider />

        <div class="flex flex-wrap items-center">
          <p>
            If you have not yet pointed a DNS zone, please check the
            <PrimeButton
              link
              class="w-fit p-0 text-sm"
              icon-pos="right"
              icon="pi pi-external-link"
              label="Documentation"
              @click="openDocumentation"
            />
          </p>
        </div>
      </template>
      <template #inputs>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Name *"
            name="name"
            disabled
            :value="name"
            placeholder="My digital certificate"
          />
        </div>
      </template>
    </FormHorizontal>
  </template>

  <template v-else>
    <FormHorizontal
      v-if="csr"
      title="Update CSR"
      description="Submit the CSR to a certificate authority. Once the certificate is signed, paste the PEM-encoded certificate in the respective field. The current certificate is hidden to protect sensitive information."
    >
      <template #inputs>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Name *"
            name="name"
            :value="name"
            placeholder="My digital certificate"
          />
        </div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label>Certificate </label>
          <PrimeTextarea
            v-model="certificate"
            :class="{ 'p-invalid': certificateError }"
            placeholder="For security purposes, the current certificate isn't exhibited, but it was correctly registered. Paste a new certificate in this field to update it."
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
            :label="'Copy'"
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
            placeholder="For security purposes, the current certificate isn't exhibited, but it was correctly registered. Paste a new certificate in this field to update it."
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
          <label>Private Key </label>
          <PrimeTextarea
            v-model="privateKey"
            :class="{ 'p-invalid': privateKeyError }"
            placeholder="For security purposes, the current private key isn't exhibited, but it was correctly registered. Paste a new private key in this field to update it."
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
      v-if="isCertificateType.trustedCertificate"
      title="Update Trusted CA Certificate"
      description="Paste the PEM-encoded Trusted CA certificate in the respective field to update the certificate. The current certificate is hidden to protect sensitive information."
    >
      <template #inputs>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Name *"
            name="name"
            placeholder="My digital certificate"
            :value="name"
          />
        </div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldTextArea
            label="Certificate"
            name="certificate"
            :value="certificate"
            placeholder="For security purposes, the current certificate isn't exhibited, but it was correctly registered. Paste a new certificate in this field to update it."
            rows="5"
            description="Intermediate certificates are accepted."
          />
        </div>
      </template>
    </FormHorizontal>
  </template>
</template>
