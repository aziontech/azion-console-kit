<script setup>
  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import { useField } from 'vee-validate'
  import { INFORMATION_TEXTS } from '@/helpers'
  import { computed } from 'vue'
  import { useVersionContext } from '@/composables/versioning/use-version-context'

  import BlocksGeneral from './blocks/generalBlock.vue'
  import BlocksMutualAuthenticationSettings from './blocks/mutualAuthenticationSettingsBlock.vue'
  import BlocksDomains from './blocks/domainsBlock.vue'
  import BlocksDeploymentSettings from './blocks/deploymentSettingsBlock.vue'
  import BlocksProtocolSettings from './blocks/protocolSettingsBlock.vue'

  const props = defineProps({
    isEdit: { type: Boolean, default: false },
    disabledEdgeApplicationDropdown: { type: Boolean, default: false },
    isDrawer: { type: Boolean },
    noBorder: { type: Boolean }
  })

  // Read-only is owned by the VersionShell context (default false outside it, so
  // the non-versioned/legacy flow is untouched). Immutable versions render the
  // form disabled.
  const { readOnly } = useVersionContext()

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
    :readOnly="readOnly"
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
  />

  <BlocksProtocolSettings
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
        :disabled="readOnly"
        title="Active"
      />
    </template>
  </form-horizontal>
</template>
