<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import PrimeButton from 'primevue/button'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'

  import { useField } from 'vee-validate'
  import { ref, computed } from 'vue'
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
    TRUSTED: 'trusted_ca_certificate',
    CRL: 'CRL'
  }

  const csrCopied = ref(false)
  const { value: name } = useField('name')
  const { value: certificate } = useField('certificate')
  const { value: csr } = useField('csr')
  const { value: certificateType } = useField('type')
  const { value: managed } = useField('managed')
  const { value: privateKey } = useField('privateKey')

  async function copyCSRToclipboard() {
    await props.clipboardWrite(csr.value)
    csrCopied.value = true
  }

  const openDocumentation = async () => {
    props.documentationService()
  }
  const isCertificateType = computed(() => {
    return {
      edgeCertificate: !csr.value && certificateType.value === certificateTypes.EDGE_CERTIFICATE,
      trustedCertificate: certificateType.value === certificateTypes.TRUSTED,
      crl: certificateType.value === certificateTypes.CRL
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
            label="Name"
            name="name"
            disabled
            required
            :value="name"
            placeholder="My digital certificate"
            data-testid="digital-certificate__name-field"
          />
        </div>
      </template>
    </FormHorizontal>
  </template>

  <template v-else>
    <FormHorizontal
      v-if="csr"
      title="Update a Server Certificate"
      description="Submit the CSR to a certificate authority. Once the certificate is signed, paste the PEM-encoded certificate in the respective field."
    >
      <template #inputs>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Name"
            name="name"
            required
            placeholder="My digital certificate"
            :value="name"
            data-testid="digital-certificate__name-field"
          />
        </div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldTextArea
            label="Certificate"
            placeholder="-----BEGIN CERTIFICATE----&#10;-----END CERTIFICATE-----"
            name="certificate"
            :value="certificate"
            data-testid="digital-certificate__certificate-field"
          />
        </div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldTextArea
            data-testid="digital-certificate__csr"
            label="Certificate Signing Request (CSR)"
            placeholder="For security purposes, the current certificate isn't exhibited, but it was correctly registered. Paste a new certificate in this field to update it."
            name="csr"
            disabled
            :value="csr"
          />
        </div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <PrimeButton
            data-testid="digital-certificate__copy-csr__button"
            class="max-sm:w-full"
            type="button"
            severity="secondary"
            label="Copy"
            @click="copyCSRToclipboard"
          />
          <small
            data-testid="digital-certificate__copy-csr__message"
            v-if="csrCopied"
            >Successfully copied!</small
          >
        </div>
      </template>
    </FormHorizontal>

    <FormHorizontal
      v-if="isCertificateType.edgeCertificate"
      title="Update a Server Certificate"
      description="Paste the PEM-encoded TLS X.509 certificate and private key in the respective fields to update the certificate. The current certificate and private key are hidden to protect sensitive information."
    >
      <template #inputs>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Name"
            name="name"
            required
            :value="name"
            placeholder="My digital certificate"
            data-testid="digital-certificate__name-field"
          />
        </div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldTextArea
            label="Certificate"
            name="certificate"
            :value="certificate"
            data-testid="digital-certificate__certificate-field"
            placeholder="-----BEGIN CERTIFICATE----&#10;-----END CERTIFICATE-----"
          />
        </div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldTextArea
            label="Private Key"
            name="privateKey"
            :value="privateKey"
            placeholder="For security purposes, the current private key isn't exhibited, but it was correctly registered. Paste a new certificate in this field to update it."
          />
        </div>
      </template>
    </FormHorizontal>

    <!-- CRL case -->
    <FormHorizontal
      v-if="isCertificateType.crl"
      title="Update a Server Certificate"
      description="Paste the PEM-encoded CRL in the respective field to update the certificate. The current certificate is hidden to protect sensitive information."
    >
      <template #inputs>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Name"
            name="name"
            required
            :value="name"
            placeholder="My digital certificate"
            data-testid="digital-certificate__name-field"
          />
        </div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldTextArea
            label="Certificate"
            name="certificate"
            :value="certificate"
            data-testid="digital-certificate__certificate-field"
            placeholder="-----BEGIN CRL----&#10;-----END CRL-----"
          />
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
            label="Name"
            name="name"
            required
            placeholder="My digital certificate"
            :value="name"
            data-testid="digital-certificate__name-field"
          />
        </div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldTextArea
            label="Certificate"
            data-testid="trusted-certificates-form__certificate-field"
            name="certificate"
            :value="certificate"
            placeholder="-----BEGIN CERTIFICATE----&#10;-----END CERTIFICATE-----"
            description="Intermediate certificates are accepted."
          />
        </div>
      </template>
    </FormHorizontal>
  </template>
</template>
