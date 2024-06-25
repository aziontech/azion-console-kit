<script setup>
  import InputText from 'primevue/inputtext'
  import PrimeTextarea from 'primevue/textarea'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import { useField } from 'vee-validate'
  import { computed, ref, watch } from 'vue'

  defineProps({
    certificateSelection: String
  })
  const emit = defineEmits(['update:certificateSelection'])

  const certificateTypes = ref({
    EDGE_CERTIFICATE_UPLOAD: 'edge_certificate',
    EDGE_CERTIFICATE_CSR: 'generateCSR',
    TRUSTED: 'trusted_ca_certificate'
  })

  const { value: digitalCertificateName, errorMessage: digitalCertificateNameError } =
    useField('digitalCertificateName')
  const { value: certificateType } = useField('certificateType', null, {
    initialValue: certificateTypes.value.EDGE_CERTIFICATE_UPLOAD
  })
  const { value: certificate, errorMessage: certificateError } = useField('certificate')
  const {
    value: privateKey,
    errorMessage: privateKeyError,
    setValue: setPrivateKeyValue
  } = useField('privateKey')

  const { value: common, errorMessage: commonError } = useField('common')
  const { value: country, errorMessage: countryError } = useField('country')
  const { value: state, errorMessage: stateError } = useField('state')
  const { value: city, errorMessage: cityError } = useField('city')
  const { value: organization, errorMessage: organizationError } = useField('organization')
  const { value: organizationUnity, errorMessage: organizationUnityError } =
    useField('organizationUnity')
  const { value: email, errorMessage: emailError } = useField('email')
  const { value: privateKeyType, errorMessage: privateKeyTypeError } = useField('privateKeyType')
  const { value: subjectAlternativeNames, errorMessage: subjectAlternativeNamesError } =
    useField('subjectAlternativeNames')

  const isUploadCertificate = computed(() => {
    return certificateType.value === certificateTypes.value.EDGE_CERTIFICATE_UPLOAD
  })
  const isEdgeCSRCertificate = computed(() => {
    return certificateType.value === certificateTypes.value.EDGE_CERTIFICATE_CSR
  })
  const isTrustedCertificate = computed(() => {
    return certificateType.value === certificateTypes.value.TRUSTED
  })

  const cetificateTypeRadioOptions = ref([
    {
      title: 'Import a server certificate',
      subtitle: 'Upload a TLS X.509 certificate and private key in PEM format.',
      inputValue: certificateTypes.value.EDGE_CERTIFICATE_UPLOAD
    },
    {
      title: 'Request a certificate',
      subtitle:
        'Generate a Certificate Signing Request (CSR) to purchase a TLS digital certificate from a CA.',
      inputValue: certificateTypes.value.EDGE_CERTIFICATE_CSR
    },
    {
      title: 'Import a Trusted CA certificate',
      subtitle:
        'Upload a certificate in PEM format that can be used for mutual Transport Layer Security (mTLS).',
      inputValue: certificateTypes.value.TRUSTED
    }
  ])

  watch(certificateType, () => {
    emit('update:certificateSelection', certificateType.value)
    const isEdgeCertificateCSR =
      certificateType.value === certificateTypes.value.EDGE_CERTIFICATE_CSR

    if (!isEdgeCertificateCSR) setPrivateKeyValue(undefined)
  })

  watch(privateKey, (privateKeyValue) => {
    if (privateKeyValue === '') setPrivateKeyValue(undefined)
  })
</script>

<template>
  <FormHorizontal
    title="General"
    description="Create a digital certificate entry to secure HTTPS edge applications."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-base font-medium"
          >Name *</label
        >
        <InputText
          v-model="digitalCertificateName"
          type="text"
          id="name"
          placeholder="My digital certificate"
          :class="{ 'p-invalid': digitalCertificateNameError }"
          data-testid="digital_certificate__name_field"
        />
        <small
          v-if="digitalCertificateNameError"
          class="p-error text-xs font-normal leading-tight"
          >{{ digitalCertificateNameError }}</small
        >
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Import or Request Certificate"
    description="Choose between importing a certificate into your account or creating a request for a certificate."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-3">
        <FieldGroupRadio
          nameField="certificateType"
          :isCard="true"
          :options="cetificateTypeRadioOptions"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    v-if="isUploadCertificate"
    title="Import a Server Certificate"
    description="Paste the PEM-encoded TLS X.509 certificate and private key in the respective fields."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>Certificate</label>
        <PrimeTextarea
          v-model="certificate"
          :class="{ 'p-invalid': certificateError }"
          placeholder="-----BEGIN CERTIFICATE-----&#10;-----END CERTIFICATE-----"
          rows="5"
          cols="30"
        />
        <small class="text-xs text-color-secondary font-normal leading-5"
          >Intermediate certificates are accepted.</small
        >
        <small
          v-if="certificateError"
          class="p-error text-xs font-normal leading-tight"
          >{{ certificateError }}</small
        >
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>Private Key</label>
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

  <FormHorizontal
    title="Request a Certificate"
    description="Generate a CSR and submit it to a certificate authority to generate a digital certificate."
    v-if="isEdgeCSRCertificate"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>Subject Name *</label>
        <InputText
          placeholder="example.com"
          v-model="common"
          type="text"
          :class="{ 'p-invalid': commonError }"
        />
        <small
          v-if="commonError"
          class="p-error text-xs font-normal leading-tight"
          >{{ commonError }}</small
        >
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>Country/Region *</label>
        <InputText
          placeholder="BR"
          v-model="country"
          type="text"
          :class="{ 'p-invalid': countryError }"
        />
        <small
          v-if="countryError"
          class="p-error text-xs font-normal leading-tight"
          >{{ countryError }}</small
        >
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>State/Province *</label>
        <InputText
          placeholder="São Paulo"
          v-model="state"
          type="text"
          :class="{ 'p-invalid': stateError }"
        />
        <small
          v-if="stateError"
          class="p-error text-xs font-normal leading-tight"
          >{{ stateError }}</small
        >
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>City/Locality *</label>
        <InputText
          placeholder="São Paulo"
          v-model="city"
          type="text"
          :class="{ 'p-invalid': cityError }"
        />
        <small
          v-if="cityError"
          class="p-error text-xs font-normal leading-tight"
          >{{ cityError }}</small
        >
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>Organization *</label>
        <InputText
          placeholder="Company Name S.A."
          v-model="organization"
          type="text"
          :class="{ 'p-invalid': organizationError }"
        />
        <small
          v-if="organizationError"
          class="p-error text-xs font-normal leading-tight"
          >{{ organizationError }}</small
        >
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>Organization Unit *</label>
        <InputText
          placeholder="IT Department"
          v-model="organizationUnity"
          type="text"
          :class="{ 'p-invalid': organizationUnityError }"
        />
        <small
          v-if="organizationUnityError"
          class="p-error text-xs font-normal leading-tight"
          >{{ organizationUnityError }}</small
        >
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>Email *</label>
        <InputText
          placeholder="example@email.com"
          v-model="email"
          type="text"
          :class="{ 'p-invalid': emailError }"
        />
        <small
          v-if="emailError"
          class="p-error text-xs font-normal leading-tight"
          >{{ emailError }}</small
        >
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>Private Key Type</label>
        <span class="p-input-icon-right w-full">
          <i class="pi pi-lock text-color-secondary" />
          <InputText
            v-model="privateKeyType"
            type="text"
            disabled
            class="w-full"
            :class="{ 'p-invalid': privateKeyTypeError }"
          />
        </span>
        <small
          v-if="privateKeyTypeError"
          class="p-error text-xs font-normal leading-tight"
          >{{ privateKeyTypeError }}</small
        >
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>Subject Alternative Names (SAN) *</label>
        <PrimeTextarea
          v-model="subjectAlternativeNames"
          :class="{ 'p-invalid': subjectAlternativeNamesError }"
          placeholder="www.example.com&#10;example.net&#10;mail.example.com&#10;support.example.com"
          rows="5"
          cols="30"
        />
        <small class="text-xs text-color-secondary font-normal leading-5"
          >Use line breaks to separate each SAN. Duplicate entries will be automatically
          removed.</small
        >
        <small
          v-if="subjectAlternativeNamesError"
          class="p-error text-xs font-normal leading-tight"
          >{{ subjectAlternativeNamesError }}</small
        >
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Import a Trusted CA certificate"
    description="Paste the PEM-encoded public Trusted CA certificate in the respective field."
    v-if="isTrustedCertificate"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label>Certificate *</label>
        <PrimeTextarea
          v-model="certificate"
          :class="{ 'p-invalid': certificateError }"
          placeholder="-----BEGIN CERTIFICATE----&#10;-----END CERTIFICATE-----"
          rows="5"
          cols="30"
        />
        <small class="text-xs text-color-secondary font-normal leading-5"
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
