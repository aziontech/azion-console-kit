<script setup>
  // v6 EditView — the Firewall landing (Versions + Settings tabs), gated by
  // `use_v6_configurations`. Logic lives in useResourceVersionLanding; chrome in
  // ResourceVersionLanding. This view only wires the Firewall config + tabs.
  import VersionsTab from '@/views/EdgeFirewall/v6/tabs/VersionsTab.vue'
  import MainSettingsTab from '@/views/EdgeFirewall/v6/tabs/MainSettingsTab.vue'
  import ResourceVersionLanding from '@/templates/version-shell-block/ResourceVersionLanding.vue'
  import { useResourceVersionLanding } from '@/composables/versioning/use-resource-version-landing'
  import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
  import { edgeFirewallVersionService } from '@/services/v2/edge-firewall/edge-firewall-version-service'

  defineOptions({ name: 'firewall-v6-edit-view' })

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
    load: (id) => edgeFirewallService.loadEdgeFirewallService({ id }),
    provideKey: 'edgeFirewall',
    versionService: edgeFirewallVersionService,
    resourceType: 'firewall',
    routeName: 'edit-firewall',
    versionRouteName: 'edit-firewall-version'
  })

  const pageDescription =
    'Each version is an isolated snapshot of this Firewall configuration. Edit a draft, then build it to publish an immutable version to the Edge.'
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
    error-message="Failed to load firewall. Try refreshing the page."
    :resource-context="deployResourceContext"
    :latest-version-id="latestVersionId"
    empty-state-description="Create a version on the Versions tab to start configuring this Firewall."
    testid-prefix="firewall-v6-edit"
  >
    <template #versions>
      <VersionsTab :firewall-id="resourceId" />
    </template>
    <template #settings>
      <MainSettingsTab
        :key="latestVersionId"
        :firewall="resource"
        :resource-id="resourceId"
        :version-id="latestVersionId"
        @command-success="handleCommandSuccess"
        @command-error="handleCommandError"
        @cancel="handleCancel"
      />
    </template>
  </ResourceVersionLanding>
</template>
