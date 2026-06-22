<script setup>
  // VersionEditorTabs — the version editor body for a Connector (atomic: a single
  // Main Settings tab; nested HTTP/Storage/LiveIngest blocks travel in the snapshot).
  // Delegates the scaffold to the shared VersionEditorTabsShell; only the tab
  // descriptor + deploy context specialize.
  import { ref } from 'vue'
  import EdgeConnectorVersionAdapter from '@/views/EdgeConnectors/v6/EdgeConnectorVersionAdapter.vue'
  import VersionEditorTabsShell from '@/templates/version-shell-block/VersionEditorTabsShell.vue'
  import FormFieldsEdgeConnectors from '@/views/EdgeConnectors/FormFields/FormFieldsEdgeConnectors.vue'
  import { edgeConnectorVersionService } from '@/services/v2/edge-connectors/edge-connector-version-service'
  import { useDeployResourceContext } from '@/composables/versioning/use-deploy-resource-context'

  defineOptions({ name: 'edge-connectors-v6-version-editor-tabs' })

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

  // Atomic resource: a single Main Settings tab, no "+ Add".
  const connectorTabs = [
    {
      key: 'main-settings',
      label: 'Main Settings',
      component: FormFieldsEdgeConnectors,
      canCreate: false,
      props: {}
    }
  ]

  const shellRef = ref(null)
  const openDeployDrawer = () => shellRef.value?.openDeployDrawer()

  defineExpose({ openDeployDrawer })
</script>

<template>
  <VersionEditorTabsShell
    ref="shellRef"
    :use-version-query="useVersionQuery"
    :resource-id="resourceId"
    :version-id="versionId"
    :resource="connector"
    :adapter="EdgeConnectorVersionAdapter"
    :tabs="connectorTabs"
    :resource-context="resourceContext"
    testid-prefix="edge-connectors-v6-edit"
    @command-success="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  />
</template>
