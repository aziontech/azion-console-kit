<template>
  <FormHorizontal
    :title="tabTitleByDCType"
    :description="tabDescriptionByDCType"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldTextArea
          data-testid="import-server-certificate-form__certificate-field"
          :label="getTitleByCertificateType"
          required
          :placeholder="getPlaceholderByCertificateType"
          name="certificate"
          :value="certificate"
          description="Intermediate certificates are accepted."
        />
      </div>

      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="isRenderPrivateKey"
      >
        <FieldTextArea
          data-testid="import-server-certificate-form__private-key-field"
          label="Private Key"
          required
          placeholder="-----BEGIN PRIVATE KEY----&#10;-----END PRIVATE KEY-----"
          name="privateKey"
          :value="privateKey"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import { useField } from 'vee-validate'
  import { computed } from 'vue'
  import { useDigitalCertificate } from '../composables/certificate'

  defineOptions({ name: 'ImportServerCertificate' })

  const { certificateType, isEdgeCertificate, CERTIFICATE_TYPES } = useDigitalCertificate()

  const { value: certificate } = useField('certificate')
  const { value: privateKey } = useField('privateKey')

  const isRenderPrivateKey = computed(() => isEdgeCertificate.value)

  const tabTitleByDCType = computed(() => {
    switch (certificateType.value) {
      case CERTIFICATE_TYPES.CERTIFICATE_REVOCATION_LIST:
        return 'Import a Certificate Revogation List (CRL)'
      default:
        return 'Import a Server Certificate'
    }
  })

  const tabDescriptionByDCType = computed(() => {
    switch (certificateType.value) {
      case CERTIFICATE_TYPES.TRUSTED:
        return 'Paste the PEM-encoded public Trusted CA certificate in the respective field.'
      case CERTIFICATE_TYPES.CERTIFICATE_REVOCATION_LIST:
        return 'Paste the PEM-encoded Certificate Revogation List (CRL) in the respective field.'
      default:
        return 'Paste the PEM-encoded TLS X.509 certificate and private key in the respective fields.'
    }
  })

  const getTitleByCertificateType = computed(() => {
    if (certificateType.value === CERTIFICATE_TYPES.CERTIFICATE_REVOCATION_LIST) {
      return 'CRL'
    }

    return 'Certificate'
  })

  const getPlaceholderByCertificateType = computed(() => {
    if (certificateType.value === CERTIFICATE_TYPES.CERTIFICATE_REVOCATION_LIST) {
      return `-----BEGIN CRL-----\n-----END CRL-----`
    }

    return `-----BEGIN CERTIFICATE-----\n-----END CERTIFICATE-----`
  })
</script>
