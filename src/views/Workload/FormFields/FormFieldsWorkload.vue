<script setup>
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import InlineMessage from 'primevue/inlinemessage'
  import { useField } from 'vee-validate'
  import { INFORMATION_TEXTS } from '@/helpers'
  import { computed } from 'vue'
  import BlocksDomains from './blocks/domainsBlock.vue'
  import BlocksDeploymentSettings from './blocks/deploymentSettingsBlock.vue'
  import BlocksProtocolSettings from './blocks/protocolSettingsBlock.vue'
  import BlocksInfrastructure from './blocks/infrastructureBlock.vue'
  import BlocksMutualAuthenticationSettings from './blocks/mutualAuthenticationSettingsBlock.vue'
  import BlocksGeneral from './blocks/generalBlock.vue'

  const props = defineProps({
    isEdit: { type: Boolean, default: false },
    disabledEdgeApplicationDropdown: { type: Boolean, default: false },
    isDrawer: { type: Boolean },
    noBorder: { type: Boolean }
  })

  const { value: isLocked } = useField('isLocked')

  const showWarningMessage = computed(() => props.isEdit && isLocked.value)
</script>

<template>
  <InlineMessage
    severity="warn"
    v-if="showWarningMessage"
  >
    <b>Warning</b>
    {{ INFORMATION_TEXTS.LOCKED_MESSAGE }}
  </InlineMessage>

  <BlocksGeneral
    :isEdit="props.isEdit"
    :isDrawer="props.isDrawer"
    :noBorder="props.noBorder"
  />

  <BlocksInfrastructure
    :isEdit="props.isEdit"
    :isDrawer="props.isDrawer"
    :noBorder="props.noBorder"
  />

  <BlocksDomains
    :isEdit="props.isEdit"
    :isDrawer="props.isDrawer"
    :noBorder="props.noBorder"
  />

  <BlocksDeploymentSettings
    :isEdit="props.isEdit"
    :isDrawer="props.isDrawer"
    :noBorder="props.noBorder"
    :disabledEdgeApplicationDropdown="props.disabledEdgeApplicationDropdown"
    :edgeApplicationServices="props.edgeApplicationServices"
    :edgeFirewallServices="props.edgeFirewallServices"
    :customPagesServices="props.customPagesServices"
  />

  <BlocksProtocolSettings
    :isEdit="props.isEdit"
    :isDrawer="props.isDrawer"
    :noBorder="props.noBorder"
    :digitalCertificatesServices="props.digitalCertificatesServices"
  />

  <BlocksMutualAuthenticationSettings
    :isEdit="props.isEdit"
    :isDrawer="props.isDrawer"
    :noBorder="props.noBorder"
    :digitalCertificatesServices="props.digitalCertificatesServices"
  />

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
