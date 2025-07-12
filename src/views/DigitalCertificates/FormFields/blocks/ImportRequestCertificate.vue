<template>
  <FormHorizontal
    :isDrawer="isDrawer"
    title="Import or Request Certificate"
    description="Choose between importing a certificate into your account or creating a request for a certificate."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-3">
        <FieldGroupRadio
          nameField="certificateType"
          :isCard="true"
          :options="certificateTypeRadioOptions"
          data-testid="digital-certificate-create-form__certificate-type"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { useField } from 'vee-validate'
  import { watch } from 'vue'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio.vue'
  import { useDigitalCertificate } from '../composables/certificate'

  defineOptions({ name: 'ImportOrRequestCertificate' })

  defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    }
  })

  const { certificateType, CERTIFICATE_TYPES } = useDigitalCertificate()

  const { value: formCertificateType } = useField('certificateType', null, {
    initialValue: certificateType.value
  })

  const certificateTypeRadioOptions = [
    {
      title: 'Import a server certificate',
      subtitle: 'Upload a TLS X.509 certificate and private key in PEM format.',
      inputValue: CERTIFICATE_TYPES.EDGE_CERTIFICATE
    },
    {
      title: 'Generate a Certificate Signing Request (CSR)',
      subtitle:
        'Generate a Certificate Signing Request (CSR) to purchase a TLS digital certificate from a CA.',
      inputValue: CERTIFICATE_TYPES.EDGE_CERTIFICATE_CSR
    }
  ]

  watch(
    () => formCertificateType.value,
    (value) => {
      certificateType.value = value
    }
  )
</script>
