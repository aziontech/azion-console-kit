<script setup>
  // v6 EditView — the Custom Page landing (Versions + Settings tabs), gated by
  // `use_v6_configurations`. Logic lives in useResourceVersionLanding; chrome in
  // ResourceVersionLanding. This view only wires the Custom Page config + tabs.
  import VersionsTab from '@/views/CustomPages/v6/tabs/VersionsTab.vue'
  import MainSettingsTab from '@/views/CustomPages/v6/tabs/MainSettingsTab.vue'
  import ResourceVersionLanding from '@/templates/version-shell-block/ResourceVersionLanding.vue'
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
    deployResourceContext,
    handleCommandSuccess,
    handleCommandError,
    handleCancel
  } = useResourceVersionLanding({
    load: (id) => customPageService.loadCustomPagesService({ id }),
    provideKey: 'customPage',
    versionService: customPageVersionService,
    resourceType: 'custom_page',
    routeName: 'edit-custom-pages',
    versionRouteName: 'edit-custom-pages-version'
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
    empty-state-description="Create a version in the Versions tab to start configuring this custom page."
    testid-prefix="custom-pages-v6-edit"
  >
    <template #versions>
      <VersionsTab :custom-page-id="resourceId" />
    </template>
    <template #settings>
      <MainSettingsTab
        :key="latestVersionId"
        :custom-page="resource"
        :resource-id="resourceId"
        :version-id="latestVersionId"
        @command-success="handleCommandSuccess"
        @command-error="handleCommandError"
        @cancel="handleCancel"
      />
    </template>
  </ResourceVersionLanding>
</template>
