<script setup>
  import PrimeButton from '@aziontech/webkit/button'

  import VersionsTab from '@/views/CustomPages/v6/tabs/VersionsTab.vue'
  import ResourceVersionLanding from '@/templates/version-shell-block/ResourceVersionLanding.vue'
  import ResourceOverviewBlock from '@/templates/version-shell-block/ResourceOverviewBlock.vue'
  import { useResourceVersionLanding } from '@/composables/versioning/use-resource-version-landing'
  import { customPageService } from '@/services/v2/custom-page/custom-page-service'
  import { customPageVersionService } from '@/services/v2/custom-page/custom-page-version-service'

  defineOptions({ name: 'custom-pages-v6-edit-view' })

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
    load: (id) => customPageService.loadCustomPagesService({ id }),
    provideKey: 'customPage',
    versionService: customPageVersionService,
    resourceType: 'custom_page',
    routeName: 'edit-custom-pages',
    versionRouteName: 'edit-custom-pages-version',
    showOverview: true
  })

  const pageDescription =
    "Each version is an isolated snapshot of this custom page's configuration. Edit a draft, then build it to publish an immutable version."
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
    error-message="Failed to load custom page. Try refreshing the page."
    :resource-context="deployResourceContext"
    :latest-version-id="latestVersionId"
    empty-state-description="Create a version on the Versions tab to start configuring this custom page."
    testid-prefix="custom-pages-v6-edit"
    :show-overview="true"
    :show-settings="false"
  >
    <template #heading-actions>
      <PrimeButton
        label="Deploy"
        icon="pi pi-cloud-upload"
        size="small"
        data-testid="custom-pages-v6-edit__deploy"
        @click="openRelease"
      />
    </template>
    <template #overview>
      <ResourceOverviewBlock
        resource-type="custom_page"
        :resource-id="resourceId"
        :raw-versions="rawVersions"
        :active-versions="activeVersions"
        :active-versions-loading="activeVersionsLoading"
        :versions-query="versionsQuery"
        testid-prefix="custom-pages-v6-overview"
      />
    </template>
    <template #versions>
      <VersionsTab :custom-page-id="resourceId" />
    </template>
  </ResourceVersionLanding>
</template>
