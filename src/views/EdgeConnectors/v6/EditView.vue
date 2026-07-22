<script setup>
  import VersionsTab from '@/views/EdgeConnectors/v6/tabs/VersionsTab.vue'
  import ResourceVersionLanding from '@/templates/version-shell-block/ResourceVersionLanding.vue'
  import { useResourceVersionLanding } from '@/composables/versioning/use-resource-version-landing'
  import { edgeConnectorsService } from '@/services/v2/edge-connectors/edge-connectors-service'
  import { edgeConnectorVersionService } from '@/services/v2/edge-connectors/edge-connector-version-service'

  defineOptions({ name: 'edge-connectors-v6-edit-view' })

  const { resource, resourceId, isLoading, loadError } = useResourceVersionLanding({
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
    :is-loading="isLoading"
    :load-error="loadError"
    :title="resource?.name ?? ''"
    :description="pageDescription"
    :entity-name="resource?.name"
    error-message="Failed to load connector. Try refreshing the page."
    :show-settings="false"
    testid-prefix="edge-connectors-v6-edit"
  >
    <template #versions>
      <VersionsTab :connector-id="resourceId" />
    </template>
  </ResourceVersionLanding>
</template>
