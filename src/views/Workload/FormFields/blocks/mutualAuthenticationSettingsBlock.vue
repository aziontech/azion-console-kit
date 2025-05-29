<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'
  import DigitalCertificatesDrawer from '@/views/DigitalCertificates/Drawer'
  import PrimeButton from 'primevue/button'

  import { ref } from 'vue'
  import { useField } from 'vee-validate'

  const props = defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    },
    noBorder: {
      type: Boolean,
      default: false
    },
    listDigitalCertificatesService: {
      type: Function,
      required: true
    },
    loadDigitalCertificatesService: {
      type: Function,
      required: true
    },
    listDigitalCertificatesCRLDropDown: {
      type: Function,
      required: true
    },
    loadDigitalCertificatesCRLDropDown: {
      type: Function,
      required: true
    }
  })

  const digitalCertificateTrustedDrawerRef = ref('')
  const listDigitalCertificatesByTrustedCaCertificateTypeDecorator = async (queryParams) => {
    return await props.listDigitalCertificatesService({
      type: 'trusted_ca_certificate',
      fields: ['id,name'],
      ...queryParams
    })
  }

  const { value: mtls } = useField('mtls')

  const openDigitalCertificateTrustedDrawer = () => {
    digitalCertificateTrustedDrawerRef.value.openCreateDrawer()
  }

  const mtlsModeRadioOptions = ref([
    {
      title: 'Enforce',
      subtitle: `Blocks the client certificate during the TLS handshake if the uploaded Trusted CA can't be validated.`,
      inputValue: 'enforce'
    },
    {
      title: 'Permissive',
      subtitle: `Attempts to verify the client certificate, but will allow the TLS handshake even if
                the Trusted CA can't be validated. Check which client certificate attempted the
                request in Edge Firewall, if necessary.`,
      inputValue: 'permissive'
    }
  ])

  const onDigitalCertificateTrustedSuccess = (certificateId) => {
    mtls.value.certificate = certificateId
  }
</script>

<template>
  <form-horizontal
    :isDrawer="isDrawer"
    :noBorder="noBorder"
    title="Mutual Authentication Settings"
    description="Enable Mutual Authentication (mTLS) to require that both client and server present an authentication protocol to each other."
  >
    <template #inputs>
      <FieldSwitchBlock
        data-testid="domains-form__mtls-is-enabled-field"
        nameField="mtls.isEnabled"
        name="mtls.isEnabled"
        auto
        :isCard="false"
        title="Mutual Authentication"
      />

      <div v-show="mtls?.isEnabled">
        <div class="flex flex-col gap-3">
          <FieldGroupRadio
            nameField="mtls.verification"
            :isCard="true"
            label="Mode"
            :options="mtlsModeRadioOptions"
          />
        </div>
      </div>
      <div
        v-if="mtls?.isEnabled"
        class="flex flex-col w-full sm:max-w-xs gap-2"
      >
        <DigitalCertificatesDrawer
          ref="digitalCertificateTrustedDrawerRef"
          useOnlyTrustedCa
          @onSuccess="onDigitalCertificateTrustedSuccess"
        />
        <FieldDropdownLazyLoader
          label="Trusted CA Certificate"
          data-testid="domains-form__mtls-trusted-certificate-field"
          required
          name="mtls.certificate"
          :service="listDigitalCertificatesByTrustedCaCertificateTypeDecorator"
          :loadService="loadDigitalCertificatesService"
          :disabled="!mtls.isEnabled"
          optionLabel="name"
          optionValue="value"
          :value="mtls.certificate"
          placeholder="Select a Trusted CA certificate"
          description="Mutual Authentification requires a Trusted CA Certificate. Go to Digital Certificates to upload one."
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  @click="openDigitalCertificateTrustedDrawer"
                  class="w-full whitespace-nowrap flex"
                  text
                  size="small"
                  icon="pi pi-plus-circle"
                  data-testid="domains-form__create-digital-certificate-trusted-button"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Create Digital Trusted CA certificate"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
      </div>
    </template>
  </form-horizontal>
</template>
