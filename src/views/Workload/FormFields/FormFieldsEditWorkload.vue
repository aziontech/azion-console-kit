<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'

  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import InlineMessage from 'primevue/inlinemessage'
  import { useField } from 'vee-validate'
  import { INFORMATION_TEXTS } from '@/helpers'

  // Blocks
  import BlocksDomains from './blocks/domainsBlock.vue'
  import BlocksDeploymentSettings from './blocks/deploymentSettingsBlock.vue'
  import BlocksProtocolSettings from './blocks/protocolSettingsBlock.vue'
  import BlocksInfrastructure from './blocks/infrastructureBlock.vue'
  import BlocksMutualAuthenticationSettings from './blocks/mutualAuthenticationSettingsBlock.vue'

  const props = defineProps({
    digitalCertificates: { type: Array, required: true },
    hasDomainName: { type: Boolean, required: false, default: false },
    listDigitalCertificatesService: { type: Function, required: true },
    loadDigitalCertificatesService: { type: Function, required: true }
  })

  const { value: name } = useField('name')
  const { value: isLocked } = useField('isLocked')

  // const showTlsAndCipherDropdown = computed(() => useHttps.value || useHttp3.value)

  // const isLocked = computed(() => productVersion.value === 'custom')

  // watch(useHttp3, (newValue) => {
  //   if (newValue) {
  //     quicPort.value = HTTP3_PORT_LIST_OPTIONS
  //   }
  // })

  // watch(useHttps, (newValue) => {
  //   if (newValue && !httpsPort.value) {
  //     httpsPort.value = [HTTPS_PORT_LIST_OPTIONS[0]]
  //   }
  // })

  // const digitalCertificateDrawerRef = ref('')
  // const openDigitalCertificateDrawer = () => {
  //   digitalCertificateDrawerRef.value.openCreateDrawer()
  // }

  // const onDigitalCertificateSuccess = (id) => {
  //   edgeCertificate.value = id
  // }

  // const listDigitalCertificatesByEdgeCertificateTypeDecorator = async (queryParams) => {
  //   return await props.listDigitalCertificatesService({
  //     type: EDGE_CERTIFICATE,
  //     fields: ['id,name'],
  //     ...queryParams
  //   })
  // }

  // const listDigitalCertificatesByTrustedCaCertificateTypeDecorator = async (queryParams) => {
  //   return await props.listDigitalCertificatesService({
  //     type: TRUSTED_CA_CERTIFICATE,
  //     fields: ['id,name'],
  //     ...queryParams
  //   })
  // }
</script>

<template>
  <InlineMessage
    severity="warn"
    v-if="isLocked"
  >
    <b>Warning</b>
    {{ INFORMATION_TEXTS.LOCKED_MESSAGE }}
  </InlineMessage>
  <form-horizontal
    title="General"
    description="Check the details of the Azion domain, including the domain address to access the application, and modify digital certificate options."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          placeholder="My domain"
          :value="name"
          description="Give a unique and descriptive name to identify the domain."
        />
      </div>
    </template>
  </form-horizontal>

  <BlocksInfrastructure
    isEdit
    :isDrawer="isDrawer"
    :noBorder="noBorder"
  />

  <BlocksDomains
    :isDrawer="isDrawer"
    :noBorder="noBorder"
    isEdit
  />

  <BlocksDeploymentSettings
    isEdit
    :isDrawer="isDrawer"
    :noBorder="noBorder"
    :disabledEdgeApplicationDropdown="props.disabledEdgeApplicationDropdown"
    :listEdgeApplicationsService="props.listEdgeApplicationsService"
    :loadEdgeApplicationsService="props.loadEdgeApplicationsService"
    :listEdgeFirewallService="props.listEdgeFirewallService"
    :loadEdgeFirewallService="loadEdgeFirewallService"
  />

  <BlocksProtocolSettings
    isEdit
    :isDrawer="isDrawer"
    :noBorder="noBorder"
    :listDigitalCertificatesService="props.listDigitalCertificatesService"
    :loadDigitalCertificatesService="props.loadDigitalCertificatesService"
  />

  <BlocksMutualAuthenticationSettings
    isEdit
    :isDrawer="isDrawer"
    :noBorder="noBorder"
    :listDigitalCertificatesService="props.listDigitalCertificatesService"
    :loadDigitalCertificatesService="props.loadDigitalCertificatesService"
    :listDigitalCertificatesCRLDropDown="props.listDigitalCertificatesCRLDropDown"
  />
  <!-- 
  <form-horizontal
    title="Mutual Authentication Settings"
    description="Enable Mutual Authentication (mTLS) to require that both client and server present an authentication protocol to each other."
  >
    <template #inputs>
      <FieldSwitchBlock
        nameField="mtlsIsEnabled"
        name="mtlsIsEnabled"
        auto
        :isCard="false"
        title="Mutual Authentication"
      />

      <div v-show="mtlsIsEnabled">
        <div class="flex flex-col gap-3">
          <FieldGroupRadio
            nameField="mtlsVerification"
            :isCard="true"
            label="Mode"
            :options="mtlsModeRadioOptions"
          />
        </div>
      </div>

      <div
        v-if="mtlsIsEnabled"
        class="flex flex-col w-full sm:max-w-xs gap-2"
      >
        <FieldDropdownLazyLoader
          label="Trusted CA Certificate"
          required
          name="mtlsTrustedCertificate"
          :service="listDigitalCertificatesByTrustedCaCertificateTypeDecorator"
          :loadService="loadDigitalCertificatesService"
          :disabled="!mtlsIsEnabled"
          optionLabel="name"
          optionValue="value"
          :value="mtlsTrustedCertificate"
          placeholder="Select a Trusted CA certificate"
          description="Mutual Authentification requires a Trusted CA Certificate. Go to Digital Certificates to upload one."
        />
      </div>
    </template>
  </form-horizontal> -->

  <form-horizontal title="Status">
    <template #inputs>
      <FieldSwitchBlock
        data-testid="edit-domains-form__active-field"
        nameField="active"
        name="active"
        auto
        :isCard="false"
        title="Active"
      />
    </template>
  </form-horizontal>
</template>
