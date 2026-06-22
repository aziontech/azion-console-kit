<script setup>
  // v6 EditView — the Connector landing (Versions + Settings tabs), gated by
  // `use_v6_configurations`. Logic lives in useResourceVersionLanding; chrome in
  // ResourceVersionLanding. This view only wires the Connector config + tabs.
  import VersionsTab from '@/views/EdgeConnectors/v6/tabs/VersionsTab.vue'
  import MainSettingsTab from '@/views/EdgeConnectors/v6/tabs/MainSettingsTab.vue'
  import ResourceVersionLanding from '@/templates/version-shell-block/ResourceVersionLanding.vue'
  import { useResourceVersionLanding } from '@/composables/versioning/use-resource-version-landing'
  import { edgeConnectorsService } from '@/services/v2/edge-connectors/edge-connectors-service'
  import { edgeConnectorVersionService } from '@/services/v2/edge-connectors/edge-connector-version-service'

  defineOptions({ name: 'edge-connectors-v6-edit-view' })

  const {
    resource,
    resourceId,
    isLoading,
    loadError,
    latestVersionId,
    activeTab,
    isDeployDrawerOpen,
    deployResourceContext,
    handleCommandSuccess,
    handleCommandError,
    handleCancel
  } = useResourceVersionLanding({
    load: (id) => edgeConnectorsService.loadEdgeConnectorsService({ id }),
    provideKey: 'edgeConnector',
    versionService: edgeConnectorVersionService,
    resourceType: 'connector',
    routeName: 'edit-connectors',
    versionRouteName: 'edit-connectors-version'
  })

  const pageDescription =
    "Each version is an isolated snapshot of this connector's configuration. Edit a draft, then build it to publish an immutable version."
</script>

<template>
  <ResourceVersionLanding
    v-model:active-tab="activeTab"
    v-model:deploy-visible="isDeployDrawerOpen"
    :is-loading="isLoading"
    :load-error="loadError"
    :title="resource?.name ?? ''"
    :description="pageDescription"
    :entity-name="resource?.name"
    error-message="Failed to load connector. Try refreshing the page."
    :resource-context="deployResourceContext"
    :latest-version-id="latestVersionId"
    empty-state-description="Create a version in the Versions tab to start configuring this connector."
    testid-prefix="edge-connectors-v6-edit"
  >
    <template #versions>
      <VersionsTab :connector-id="resourceId" />
    </template>
    <template #settings>
      <MainSettingsTab
        :key="latestVersionId"
        :connector="resource"
        :resource-id="resourceId"
        :version-id="latestVersionId"
        @command-success="handleCommandSuccess"
        @command-error="handleCommandError"
        @cancel="handleCancel"
      />
    </template>
  </ResourceVersionLanding>
</template>
