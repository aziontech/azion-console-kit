<script setup>
  /**
   * v6 EditView — the Application landing screen, gated by
   * `use_v6_configurations`. Uses the shared ResourceVersionLanding shell
   * (mirrors Firewall) and plugs into it three tabs: Overview + Versions +
   * Variables. The version editor lives in a separate screen
   * (`edit-application-version`); Deploy from the heading routes to the
   * full-page release composer.
   *
   * The flag check stays centralized in the router (req 10.1) — this view never
   * imports user-flag.
   */
  import PrimeButton from '@aziontech/webkit/button'

  import ResourceVersionLanding from '@/templates/version-shell-block/ResourceVersionLanding.vue'
  import ResourceOverviewBlock from '@/templates/version-shell-block/ResourceOverviewBlock.vue'
  import VersionsTab from '@/views/EdgeApplications/v6/tabs/VersionsTab.vue'
  import ScopedVariablesTab from '@/views/Variables/v6/components/ScopedVariablesTab.vue'
  import { useResourceVersionLanding } from '@/composables/versioning/use-resource-version-landing'
  import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
  import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'

  defineOptions({ name: 'application-v6-edit-view' })

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
    load: (id) => edgeAppService.loadEdgeApplicationService({ id }),
    provideKey: 'edgeApplication',
    versionService: edgeAppVersionService,
    resourceType: 'application',
    routeName: 'edit-application',
    versionRouteName: 'edit-application-version',
    showOverview: true
  })

  const pageDescription =
    "Each version is an isolated snapshot of this Application's configuration. Edit a draft, then build it to publish an immutable version to the Edge."
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
    error-message="Failed to load application. Try refreshing the page."
    :resource-context="deployResourceContext"
    :latest-version-id="latestVersionId"
    empty-state-description="Create a version on the Versions tab to start configuring this Application."
    testid-prefix="application-v6-edit"
    :show-overview="true"
    :show-settings="false"
    :show-variables="true"
  >
    <template #heading-actions>
      <PrimeButton
        label="Deploy"
        icon="pi pi-cloud-upload"
        size="small"
        data-testid="application-v6-edit__deploy"
        @click="openRelease"
      />
    </template>
    <template #overview>
      <ResourceOverviewBlock
        resource-type="application"
        :resource-id="resourceId"
        :raw-versions="rawVersions"
        :active-versions="activeVersions"
        :active-versions-loading="activeVersionsLoading"
        :versions-query="versionsQuery"
        testid-prefix="application-v6-overview"
      />
    </template>
    <template #versions>
      <VersionsTab :application-id="resourceId" />
    </template>
    <template #variables>
      <ScopedVariablesTab
        scope-type="application"
        :scope-id="resourceId"
      />
    </template>
  </ResourceVersionLanding>
</template>
