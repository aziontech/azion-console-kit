<script setup>
  import PrimeButton from '@aziontech/webkit/button'

  import VersionsTab from '@/views/EdgeFirewall/v6/tabs/VersionsTab.vue'
  import ResourceVersionLanding from '@/templates/version-shell-block/ResourceVersionLanding.vue'
  import ResourceOverviewBlock from '@/templates/version-shell-block/ResourceOverviewBlock.vue'
  import ScopedVariablesTab from '@/views/Variables/v6/components/ScopedVariablesTab.vue'
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
    openRelease,
    deployResourceContext,
    versionsQuery,
    rawVersions,
    activeVersions,
    activeVersionsLoading
  } = useResourceVersionLanding({
    load: (id) => edgeFirewallService.loadEdgeFirewallService({ id }),
    provideKey: 'edgeFirewall',
    versionService: edgeFirewallVersionService,
    resourceType: 'firewall',
    routeName: 'edit-firewall',
    versionRouteName: 'edit-firewall-version',
    showOverview: true
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
    :show-overview="true"
    :show-settings="false"
    :show-variables="true"
  >
    <template #heading-actions>
      <PrimeButton
        label="Deploy"
        icon="pi pi-cloud-upload"
        size="small"
        data-testid="firewall-v6-edit__deploy"
        @click="openRelease"
      />
    </template>
    <template #overview>
      <ResourceOverviewBlock
        resource-type="firewall"
        :resource-id="resourceId"
        :raw-versions="rawVersions"
        :active-versions="activeVersions"
        :active-versions-loading="activeVersionsLoading"
        :versions-query="versionsQuery"
        testid-prefix="firewall-v6-overview"
      />
    </template>
    <template #versions>
      <VersionsTab :firewall-id="resourceId" />
    </template>
    <template #variables>
      <ScopedVariablesTab
        scope-type="firewall"
        :scope-id="resourceId"
      />
    </template>
  </ResourceVersionLanding>
</template>
