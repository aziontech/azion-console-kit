<script setup>
  // MainSettingsTab — the "Settings" outer tab of EditView for a Connector.
  // Wraps FormFieldsEdgeConnectors in VersionShell → EdgeConnectorVersionAdapter so
  // the form binds to the latest version and lifecycle actions work. Owns no routing
  // or toast: commands bubble up; EditView decides navigation + toast.
  import EdgeConnectorVersionAdapter from '@/views/EdgeConnectors/v6/EdgeConnectorVersionAdapter.vue'
  import VersionHeadingActions from '@/templates/version-shell-block/components/VersionHeadingActions.vue'
  import VersionShell from '@/templates/version-shell-block/index.vue'
  import FormFieldsEdgeConnectors from '@/views/EdgeConnectors/FormFields/FormFieldsEdgeConnectors.vue'
  import { edgeConnectorVersionService } from '@/services/v2/edge-connectors/edge-connector-version-service'
  import { useDeployResourceContext } from '@/composables/versioning/use-deploy-resource-context'

  defineOptions({ name: 'edge-connectors-v6-main-settings-tab' })

  const props = defineProps({
    connector: {
      type: Object,
      required: true
    },
    resourceId: {
      type: [String, Number],
      required: true
    },
    versionId: {
      type: String,
      required: true
    }
  })

  const emit = defineEmits(['command-success', 'command-error', 'cancel'])

  const useVersionQuery = () =>
    edgeConnectorVersionService.useLoadVersionQuery(props.resourceId, props.versionId)

  const { resourceContext } = useDeployResourceContext({
    resourceType: 'connector',
    injectionKey: 'edgeConnector',
    versionService: edgeConnectorVersionService,
    currentVersionId: () => props.versionId
  })
</script>

<template>
  <VersionShell
    :use-version-query="useVersionQuery"
    :resource-id="resourceId"
    :version-id="versionId"
    data-testid="edge-connectors-v6-main-settings__shell"
    @updated="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  >
    <EdgeConnectorVersionAdapter
      :resource="connector"
      :resource-id="resourceId"
      :version-id="versionId"
    >
      <div class="relative">
        <FormFieldsEdgeConnectors class="flex flex-col gap-4" />
        <VersionHeadingActions :resource-context="resourceContext" />
      </div>
    </EdgeConnectorVersionAdapter>
  </VersionShell>
</template>
