<script setup>
  // v6 EditView — the Network List landing (Versions + Settings tabs), gated by
  // `use_v6_configurations`. Logic lives in useResourceVersionLanding; chrome in
  // ResourceVersionLanding. This view only wires the Network List config + tabs.
  import VersionsTab from '@/views/NetworkLists/v6/tabs/VersionsTab.vue'
  import ResourceVersionLanding from '@/templates/version-shell-block/ResourceVersionLanding.vue'
  import { useResourceVersionLanding } from '@/composables/versioning/use-resource-version-landing'
  import { networkListsService } from '@/services/v2/network-lists/network-lists-service'
  import { networkListVersionService } from '@/services/v2/network-lists/network-list-version-service'

  defineOptions({ name: 'network-lists-v6-edit-view' })

  const { resource, resourceId, isLoading, loadError, isDeployDrawerOpen, deployResourceContext } =
    useResourceVersionLanding({
      load: (id) => networkListsService.loadNetworkList({ id }),
      provideKey: 'networkList',
      versionService: networkListVersionService,
      resourceType: 'network_list',
      routeName: 'edit-network-lists',
      versionRouteName: 'edit-network-lists-version'
    })

  const pageDescription =
    "Each version is an isolated snapshot of this network list's configuration. Edit a draft, then build it to publish an immutable version."
</script>

<template>
  <ResourceVersionLanding
    v-model:deploy-visible="isDeployDrawerOpen"
    :is-loading="isLoading"
    :load-error="loadError"
    :title="resource?.name ?? ''"
    :description="pageDescription"
    :entity-name="resource?.name"
    error-message="Failed to load network list. Try refreshing the page."
    :resource-context="deployResourceContext"
    :show-settings="false"
    testid-prefix="network-lists-v6-edit"
  >
    <template #versions>
      <VersionsTab :network-list-id="resourceId" />
    </template>
  </ResourceVersionLanding>
</template>
