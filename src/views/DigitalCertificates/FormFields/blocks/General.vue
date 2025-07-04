<template>
  <FormHorizontal
    :isDrawer="isDrawer"
    title="General"
    :description="tabDescriptionByDCType"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="digitalCertificateName"
          placeholder="My digital certificate"
          :value="digitalCertificateName"
          data-testid="digital-certificate__name-field"
          :description="inputDescriptionByDCType"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { computed } from 'vue'
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import { useDigitalCertificate } from '../composables/certificate'

  defineOptions({ name: 'DigitalCertificatesFormFieldsGeneral' })

  defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    }
  })

  const { certificateType, CERTIFICATE_TYPES } = useDigitalCertificate()

  const { value: digitalCertificateName } = useField('digitalCertificateName')

  const tabDescriptionByDCType = computed(() => {
    switch (certificateType.value) {
      case CERTIFICATE_TYPES.TRUSTED:
        return 'Create a digital certificate that can be used for mutual Transport Layer Security (mTLS).'
      case CERTIFICATE_TYPES.CERTIFICATE_REVOCATION_LIST:
        return 'Create an entry to manage a Certificate Revocation List (CRL) and ensure the security of HTTPS edge applications.'
      default:
        return 'Create a digital certificate entry to secure HTTPS edge applications.'
    }
  })

  const inputDescriptionByDCType = computed(() => {
    switch (certificateType.value) {
      case CERTIFICATE_TYPES.TRUSTED:
        return 'Give a unique and descriptive name to identify the trusted certificate.'
      case CERTIFICATE_TYPES.CERTIFICATE_REVOCATION_LIST:
        return 'Give a unique and descriptive name to identify the CRL.'
      default:
        return ''
    }
  })
</script>
