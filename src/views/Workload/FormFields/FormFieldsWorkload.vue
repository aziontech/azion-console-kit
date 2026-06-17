<script setup>
  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import { useField } from 'vee-validate'
  import { INFORMATION_TEXTS } from '@/helpers'
  import { computed } from 'vue'
  import { hasFlagUseV6Configurations } from '@/composables/user-flag'

  import BlocksGeneral from './blocks/generalBlock.vue'
  import BlocksMutualAuthenticationSettings from './blocks/mutualAuthenticationSettingsBlock.vue'

  // v6 (versioned) blocks
  import BlocksDomains from './blocks/domainsBlock.vue'
  import BlocksDeploymentSettings from './blocks/deploymentSettingsBlock.vue'
  import BlocksProtocolSettings from './blocks/protocolSettingsBlock.vue'

  // legacy (non-versioned) blocks
  import BlocksInfrastructure from './blocks/infrastructureBlock.vue'
  import LegacyBlocksDomains from '../legacy/blocks/domainsBlock.vue'
  import LegacyBlocksDeploymentSettings from '../legacy/blocks/deploymentSettingsBlock.vue'
  import LegacyBlocksProtocolSettings from '../legacy/blocks/protocolSettingsBlock.vue'

  const props = defineProps({
    isEdit: { type: Boolean, default: false },
    disabledEdgeApplicationDropdown: { type: Boolean, default: false },
    isDrawer: { type: Boolean },
    noBorder: { type: Boolean }
  })

  const isV6 = hasFlagUseV6Configurations()

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
    v-if="!isV6"
    :isEdit="props.isEdit"
    :isDrawer="props.isDrawer"
    :noBorder="props.noBorder"
  />

  <BlocksDomains
    v-if="isV6"
    :isEdit="props.isEdit"
    :isDrawer="props.isDrawer"
    :noBorder="props.noBorder"
  />
  <LegacyBlocksDomains
    v-else
    :isEdit="props.isEdit"
    :isDrawer="props.isDrawer"
    :noBorder="props.noBorder"
  />

  <BlocksDeploymentSettings
    v-if="isV6"
    :isEdit="props.isEdit"
    :isDrawer="props.isDrawer"
    :noBorder="props.noBorder"
    :disabledEdgeApplicationDropdown="props.disabledEdgeApplicationDropdown"
  />
  <LegacyBlocksDeploymentSettings
    v-else
    :isEdit="props.isEdit"
    :isDrawer="props.isDrawer"
    :noBorder="props.noBorder"
    :disabledEdgeApplicationDropdown="props.disabledEdgeApplicationDropdown"
  />

  <BlocksProtocolSettings
    v-if="isV6"
    :isEdit="props.isEdit"
    :isDrawer="props.isDrawer"
    :noBorder="props.noBorder"
  />
  <LegacyBlocksProtocolSettings
    v-else
    :isEdit="props.isEdit"
    :isDrawer="props.isDrawer"
    :noBorder="props.noBorder"
  />

  <BlocksMutualAuthenticationSettings
    :isEdit="props.isEdit"
    :isDrawer="props.isDrawer"
    :noBorder="props.noBorder"
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
