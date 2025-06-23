<template>
  <FormHorizontal
    :isDrawer="isDrawer"
    title="Request a Certificate"
    description="Generate a CSR and submit it to a certificate authority to generate a digital certificate."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Subject Name"
          required
          name="common"
          placeholder="example.com"
          :value="common"
          data-testid="digital-certificate__subject-name-field"
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
        <Dropdown
          v-model="privateKeyType"
          :options="PRIVATE_KEY_TYPES"
          optionLabel="name"
          optionValue="value"
          placeholder="Select a Private Key Type"
          class="w-full md:w-14rem"
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
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import Dropdown from 'primevue/dropdown'
  import { useField } from 'vee-validate'
  import { ref } from 'vue'

  defineOptions({ name: 'RequestCertificate' })

  defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    }
  })

  const PRIVATE_KEY_TYPES = ref([
    { name: '2048-bit RSA', value: 'BIT_RSA_2048' },
    { name: '4096-bit RSA', value: 'BIT_RSA_4096' },
    { name: '384-bit Prime Field Curve', value: 'ECC_384' }
  ])

  const { value: common } = useField('common')
  const { value: country } = useField('country')
  const { value: state } = useField('state')
  const { value: city } = useField('city')
  const { value: organization } = useField('organization')
  const { value: organizationUnity } = useField('organizationUnity')
  const { value: email } = useField('email')
  const { value: privateKeyType } = useField('privateKeyType')
  const { value: subjectAlternativeNames } = useField('subjectAlternativeNames')
</script>
