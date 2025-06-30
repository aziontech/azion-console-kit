<template>
  <FormHorizontal
    title="Mutual Authentication Settings"
    description="Enable Mutual Authentication (mTLS) to require that both client and server present an authentication protocol to each other."
    data-testid="edge-connectors-form__section__mutual-authentication-settings"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <FieldSwitchBlock
          nameField="mutualAuthentication"
          name="mutualAuthentication"
          auto
          :isCard="false"
          :value="mutualAuthentication"
          title="Mutual Authentication"
          data-testid="edge-connectors-form__mutual-authentication-settings__mutual-authentication-field"
        />
      </div>

      <Drawer
        ref="drawerRef"
        :certificate="certificateType"
        @onSuccess="handleSuccessDrawerCreated"
      />

      <div class="flex flex-col gap-2 sm:max-w-sm w-full">
        <FieldDropdownLazyLoader
          data-testid="edge-connectors-form__mutual-authentication-settings__trusted-ca-certificate"
          label="Trusted CA Certificate"
          description="Mutual Authentification requires a Trusted CA Certificate."
          placeholder="Select a Trusted CA Certificate"
          required
          name="trustedCaCertificate"
          :service="listDigitalCertificatesDropdownDecorator"
          :loadService="digitalCertificatesService.loadDigitalCertificate"
          disableEmitFirstRender
          optionLabel="name"
          optionValue="id"
          :value="trustedCaCertificate"
          inputId="trustedCaCertificate"
          @onSelectOption="changeTrustedCaCertificate"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  class="w-full whitespace-nowrap flex"
                  data-testid="edge-connectors-form__mutual-authentication-settings__create-trusted-ca-certificate-button"
                  text
                  @click="openDrawer('trusted_ca_certificate')"
                  size="small"
                  icon="pi pi-plus-circle"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Import a Trusted Certificate"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
      </div>

      <div class="flex flex-col gap-2 sm:max-w-xs w-full">
        <FieldDropdownMultiSelectLazyLoader
          label="Certificate Revocation List  (CRL)"
          description="Ensures revoked certificates are rejected during mTLS authentication."
          placeholder="Select a Certificate Revocation List"
          name="crlCertificate"
          :service="listDigitalCertificatesCRLDecorator"
          :loadService="digitalCertificatesCRLService.loadDigitalCertificateCRL"
          optionLabel="name"
          optionValue="id"
          :value="crlCertificate"
          inputId="crlCertificate"
          @onSelectOption="changeCrlCertificate"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  class="w-full whitespace-nowrap flex"
                  data-testid="edge-connectors-form__mutual-authentication-settings__create-trusted-ca-certificate-button"
                  text
                  @click="openDrawer('certificateRevogationList')"
                  size="small"
                  icon="pi pi-plus-circle"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Import a CRL"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownMultiSelectLazyLoader>
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { ref } from 'vue'
  import { useField } from 'vee-validate'
  import PrimeButton from 'primevue/button'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'
  import FieldDropdownMultiSelectLazyLoader from '@/templates/form-fields-inputs/fieldDropdownMultiSelectLazyLoader.vue'
  import Drawer from '@/views/DigitalCertificates/Drawer'
  import { digitalCertificatesService, digitalCertificatesCRLService } from '@/services/v2'

  defineOptions({ name: 'EdgeConnectorsFormFieldsMutualAuthenticationSettings' })

  const { value: mutualAuthentication } = useField('mutualAuthentication')
  const { value: trustedCaCertificate } = useField('trustedCaCertificate')
  const { value: crlCertificate } = useField('crlCertificate')

  const drawerRef = ref(null)
  const certificateType = ref('trusted_ca_certificate')

  const handleSuccessDrawerCreated = (id) => {
    if (certificateType.value === 'trusted_ca_certificate') {
      trustedCaCertificate.value = id
    } else if (certificateType.value === 'certificateRevogationList') {
      crlCertificate.value = id
    }
  }

  const openDrawer = (certificate) => {
    certificateType.value = certificate
    drawerRef.value.openCreateDrawer()
  }

  const listDigitalCertificatesDropdownDecorator = async (params) => {
    return await digitalCertificatesService.listDigitalCertificatesDropdown(
      params,
      'trusted_ca_certificate'
    )
  }

  const listDigitalCertificatesCRLDecorator = async (params) => {
    return await digitalCertificatesCRLService.listDigitalCertificatesCRL(params)
  }
</script>
