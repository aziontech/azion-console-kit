<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import { useField } from 'vee-validate'

  // Blocks
  import BlocksDomains from './blocks/domainsBlock.vue'
  import BlocksDeploymentSettings from './blocks/deploymentSettingsBlock.vue'
  import BlocksProtocolSettings from './blocks/protocolSettingsBlock.vue'
  import BlocksInfrastructure from './blocks/infrastructureBlock.vue'
  import BlocksMutualAuthenticationSettings from './blocks/mutualAuthenticationSettingsBlock.vue'

  const props = defineProps({
    listEdgeApplicationsService: {
      type: Function,
      required: true
    },
    loadEdgeApplicationsService: {
      type: Function,
      required: true
    },

    listEdgeFirewallService: {
      type: Function,
      required: true
    },
    loadEdgeFirewallService: {
      type: Function,
      required: true
    },

    listDigitalCertificatesService: {
      type: Function,
      required: true
    },
    loadDigitalCertificatesService: {
      type: Function,
      required: true
    },

    disabledEdgeApplicationDropdown: {
      type: Boolean,
      default: false
    },
    isDrawer: {
      type: Boolean
    },
    noBorder: {
      type: Boolean
    },

    listDigitalCertificatesCRLDropDown: {
      type: Function,
      required: true
    },
    loadDigitalCertificatesCRLDropDown: {
      type: Function,
      required: true
    },

    listCustomPagesService: {
      type: Function,
      required: true
    },
    loadCustomPagesService: {
      type: Function,
      required: true
    }
  })

  const { value: name } = useField('name')
</script>

<template>
  <form-horizontal
    description="Create a workload with Azion to launch an edge application and set up security with digital certificates."
    :isDrawer="isDrawer"
    :noBorder="noBorder"
  >
    <template #title> General </template>
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          placeholder="My workload"
          data-testid="domains-form__name-field"
          :value="name"
          description="This is an identification name for the workload. Once you save the configuration, the URL will be automatically generated."
        />
      </div>
    </template>
  </form-horizontal>

  <BlocksInfrastructure
    :isDrawer="isDrawer"
    :noBorder="noBorder"
  />

  <BlocksDomains
    :isDrawer="isDrawer"
    :noBorder="noBorder"
  />

  <BlocksDeploymentSettings
    :isDrawer="isDrawer"
    :noBorder="noBorder"
    :disabledEdgeApplicationDropdown="props.disabledEdgeApplicationDropdown"
    :listEdgeApplicationsService="props.listEdgeApplicationsService"
    :loadEdgeApplicationsService="props.loadEdgeApplicationsService"
    :listEdgeFirewallService="props.listEdgeFirewallService"
    :loadEdgeFirewallService="props.loadEdgeFirewallService"
    :listCustomPagesService="props.listCustomPagesService"
    :loadCustomPagesService="props.loadCustomPagesService"
  />

  <BlocksProtocolSettings
    :isDrawer="isDrawer"
    :noBorder="noBorder"
    :listDigitalCertificatesService="props.listDigitalCertificatesService"
    :loadDigitalCertificatesService="props.loadDigitalCertificatesService"
  />

  <BlocksMutualAuthenticationSettings
    :isDrawer="isDrawer"
    :noBorder="noBorder"
    :listDigitalCertificatesService="props.listDigitalCertificatesService"
    :loadDigitalCertificatesService="props.loadDigitalCertificatesService"
    :listDigitalCertificatesCRLDropDown="props.listDigitalCertificatesCRLDropDown"
  />

  <form-horizontal
    title="Status"
    :noBorder="noBorder"
    :isDrawer="isDrawer"
  >
    <template #inputs>
      <FieldSwitchBlock
        data-testid="domains-form__active-field"
        nameField="active"
        name="active"
        auto
        :isCard="false"
        title="Active"
      />
    </template>
  </form-horizontal>
</template>
