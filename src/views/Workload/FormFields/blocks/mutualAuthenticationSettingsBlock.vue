<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import fieldDropdownLazyLoaderWithFilter from '@/templates/form-fields-inputs/fieldDropdownLazyLoaderWithFilter.vue'

  import DigitalCertificatesDrawer from '@/views/DigitalCertificates/Drawer'
  import fieldDropdownMultiSelectLazyLoader from '@/templates/form-fields-inputs/fieldDropdownMultiSelectLazyLoader.vue'
  import PrimeButton from 'primevue/button'
  import { digitalCertificatesService, digitalCertificatesCRLService } from '@/services/v2'
  import { ref, watch } from 'vue'
  import { useField } from 'vee-validate'

  const drawerRef = ref('')

  const listDigitalCertificatesByTrustedCaCertificateTypeDecorator = async (queryParams) => {
    return await digitalCertificatesService.listDigitalCertificatesDropdown({
      fields: ['id,name, type, status'],
      type: 'trusted_ca_certificate',
      ...queryParams
    })
  }

  const { value: mtls } = useField('mtls')
  const { value: useHttps } = useField('protocols.http.useHttps')

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
                request in Firewall, if necessary.`,
      inputValue: 'permissive'
    }
  ])

  const onDigitalCertificateTrustedSuccess = ({ type, id }) => {
    if (type === 'trusted_ca_certificate') {
      mtls.value.certificate = id
      return
    }
    mtls.value.crl = [...mtls.value.crl, id]
  }

  const openDrawer = (certificate) => {
    drawerRef.value.changeCertificateType(certificate)
    drawerRef.value.openCreateDrawer()
  }
  watch(
    () => useHttps.value,
    (newValue) => {
      if (!newValue) {
        mtls.value.isEnabled = false
      }
    }
  )
</script>

<template>
  <form-horizontal
    title="Mutual Authentication Settings"
    description="Enable Mutual Authentication (mTLS) to require that both client and server present an authentication protocol to each other."
  >
    <template #inputs>
      <div class="flex flex-col">
        <FieldSwitchBlock
          data-testid="domains-form__mtls-is-enabled-field"
          nameField="mtls.isEnabled"
          name="mtls.isEnabled"
          auto
          :isCard="false"
          title="Mutual Authentication"
          :disabled="!useHttps"
        />

        <small
          v-if="!useHttps"
          class="flex items-center gap-1.5 ml-14"
        >
          <i class="pi pi-lock text-color-secondary"></i>
          <span class="text-color-secondary text-sm font-normal">
            You can active this setting enabling HTTPS support above.
          </span>
        </small>
      </div>

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
          ref="drawerRef"
          @onSuccess="onDigitalCertificateTrustedSuccess"
        />

        <fieldDropdownLazyLoaderWithFilter
          label="Trusted CA Certificate"
          data-testid="domains-form__mtls-trusted-certificate-field"
          required
          name="mtls.certificate"
          :service="listDigitalCertificatesByTrustedCaCertificateTypeDecorator"
          :loadService="digitalCertificatesService.loadDigitalCertificate"
          :disabled="!mtls.isEnabled"
          optionLabel="name"
          optionValue="value"
          keyToFilter="status"
          :valuesToFilter="['active', 'challenge_verification']"
          :value="mtls.certificate"
          placeholder="Select a Trusted CA certificate"
          description="Mutual Authentification requires a Trusted CA Certificate."
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  @click="openDrawer('trusted_ca_certificate')"
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
        </fieldDropdownLazyLoaderWithFilter>
      </div>
      <div
        v-if="mtls?.isEnabled"
        class="flex flex-col w-full sm:max-w-xs gap-2"
      >
        <fieldDropdownMultiSelectLazyLoader
          label="Certificate Revocation List  (CRL)"
          data-testid="domains-form__mtls-crl-certificate-field"
          name="mtls.crl"
          :service="digitalCertificatesCRLService.listDigitalCertificatesCRLDropdown"
          :loadService="digitalCertificatesCRLService.loadDigitalCertificateCRL"
          :disabled="!mtls.isEnabled"
          optionLabel="name"
          optionValue="value"
          :value="mtls.crl"
          placeholder="Select a CRL certificate"
          description="Ensures revoked certificates are rejected during mTLS authentication."
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  @click="openDrawer('certificateRevogationList')"
                  class="w-full whitespace-nowrap flex"
                  text
                  size="small"
                  icon="pi pi-plus-circle"
                  data-testid="domains-form__create-digital-certificate-crl-button"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Create Digital CRL certificate"
                />
              </li>
            </ul>
          </template>
        </fieldDropdownMultiSelectLazyLoader>
      </div>
    </template>
  </form-horizontal>
</template>
