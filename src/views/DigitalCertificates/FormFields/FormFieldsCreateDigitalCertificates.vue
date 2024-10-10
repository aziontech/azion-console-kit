<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextIcon from '@/templates/form-fields-inputs/fieldTextIcon'
  import { useField } from 'vee-validate'
  import { computed, watch } from 'vue'

  defineProps({
    certificateSelection: String,
    isDrawer: {
      type: Boolean
    }
  })
  const emit = defineEmits(['update:certificateSelection'])

  const certificateTypesMap = {
    EDGE_CERTIFICATE_UPLOAD: 'edge_certificate',
    EDGE_CERTIFICATE_CSR: 'generateCSR',
    TRUSTED: 'trusted_ca_certificate'
  }

  const { value: digitalCertificateName } = useField('digitalCertificateName')
  const { value: certificateType } = useField('certificateType', null, {
    initialValue: certificateTypesMap.EDGE_CERTIFICATE_UPLOAD
  })
  const { value: certificate } = useField('certificate')
  const { value: privateKey, setValue: setPrivateKeyValue } = useField('privateKey')

  const { value: common } = useField('common')
  const { value: country } = useField('country')
  const { value: state } = useField('state')
  const { value: city } = useField('city')
  const { value: organization } = useField('organization')
  const { value: organizationUnity } = useField('organizationUnity')
  const { value: email } = useField('email')
  const { value: privateKeyType } = useField('privateKeyType')
  const { value: subjectAlternativeNames } = useField('subjectAlternativeNames')

  const isCertificateType = computed(() => {
    return {
      edgeCertificateCSR: certificateType.value === certificateTypesMap.EDGE_CERTIFICATE_CSR,
      trustedCertificate: certificateType.value === certificateTypesMap.TRUSTED,
      uploadCertificate: certificateType.value === certificateTypesMap.EDGE_CERTIFICATE_UPLOAD
    }
  })

  const certificateTypeRadioOptions = [
    {
      title: 'Import a server certificate',
      subtitle: 'Upload a TLS X.509 certificate and private key in PEM format.',
      inputValue: certificateTypesMap.EDGE_CERTIFICATE_UPLOAD
    },
    {
      title: 'Request a certificate',
      subtitle:
        'Generate a Certificate Signing Request (CSR) to purchase a TLS digital certificate from a CA.',
      inputValue: certificateTypesMap.EDGE_CERTIFICATE_CSR
    },
    {
      title: 'Import a Trusted CA certificate',
      subtitle:
        'Upload a certificate in PEM format that can be used for mutual Transport Layer Security (mTLS).',
      inputValue: certificateTypesMap.TRUSTED
    }
  ]

  watch(certificateType, () => {
    emit('update:certificateSelection', certificateType.value)
    const isEdgeCertificateCSR = certificateType.value === certificateTypesMap.EDGE_CERTIFICATE_CSR

    if (!isEdgeCertificateCSR) setPrivateKeyValue(undefined)
  })

  watch(privateKey, (privateKeyValue) => {
    if (privateKeyValue === '') setPrivateKeyValue(undefined)
  })
</script>

<template>
  <FormHorizontal
    :isDrawer="isDrawer"
    title="General"
    description="Create a digital certificate entry to secure HTTPS edge applications."
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
        />
      </div>
    </template>
  </FormHorizontal>

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

  <FormHorizontal
    v-if="isCertificateType.uploadCertificate"
    :isDrawer="isDrawer"
    title="Import a Server Certificate"
    description="Paste the PEM-encoded TLS X.509 certificate and private key in the respective fields."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldTextArea
          data-testid="digital-certificate__certificate-field"
          label="Certificate"
          placeholder="-----BEGIN CERTIFICATE-----&#10;-----END CERTIFICATE-----"
          name="certificate"
          :value="certificate"
          description="Intermediate certificates are accepted."
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldTextArea
          data-testid="digital-certificate__private-key-field"
          label="Private Key"
          placeholder="-----BEGIN PRIVATE KEY-----&#10;-----END PRIVATE KEY-----"
          name="privateKey"
          :value="privateKey"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Request a Certificate"
    description="Generate a CSR and submit it to a certificate authority to generate a digital certificate."
    v-if="isCertificateType.edgeCertificateCSR"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="digital-certificate__subject-name"
          label="Subject Name"
          required
          placeholder="example.com"
          :value="common"
          name="common"
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="digital-certificate__country"
          label="Country/Region"
          required
          placeholder="BR"
          :value="country"
          name="country"
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="digital-certificate__state"
          label="State/Province"
          required
          placeholder="São Paulo"
          :value="state"
          name="state"
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="digital-certificate__city"
          label="City/Locality"
          required
          placeholder="São Paulo"
          :value="city"
          name="city"
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="digital-certificate__organization"
          label="Organization"
          required
          placeholder="Company Name S.A."
          :value="organization"
          name="organization"
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="digital-certificate__organization-unit"
          label="Organization Unit"
          required
          placeholder="IT Department"
          :value="organizationUnity"
          name="organizationUnity"
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="digital-certificate__email"
          label="Email"
          required
          placeholder="example@email.com"
          type="email"
          :value="email"
          name="email"
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldTextIcon
          label="Private Key Type"
          disabled
          icon="pi pi-lock"
          iconPosition="right"
          :value="privateKeyType"
          name="privateKeyType"
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldTextArea
          data-testid="digital-certificate__san"
          label="Subject Alternative Names (SAN)"
          required
          placeholder="www.example.com&#10;example.net&#10;mail.example.com&#10;support.example.com"
          name="subjectAlternativeNames"
          :value="subjectAlternativeNames"
          description="Use line breaks to separate each SAN. Duplicate entries will be automatically removed."
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Import a Trusted CA certificate"
    description="Paste the PEM-encoded public Trusted CA certificate in the respective field."
    v-if="isCertificateType.trustedCertificate"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldTextArea
          data-testid="trusted-certificates-form__certificate-field"
          label="Certificate"
          required
          placeholder="-----BEGIN CERTIFICATE----&#10;-----END CERTIFICATE-----"
          name="certificate"
          :value="certificate"
          description="Intermediate certificates are accepted."
        />
      </div>
    </template>
  </FormHorizontal>
</template>
