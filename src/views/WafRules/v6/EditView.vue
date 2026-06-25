<script setup>
  import VersionsTab from '@/views/WafRules/v6/tabs/VersionsTab.vue'
  import MainSettingsTab from '@/views/WafRules/v6/tabs/MainSettingsTab.vue'
  import ResourceVersionLanding from '@/templates/version-shell-block/ResourceVersionLanding.vue'
  import { useResourceVersionLanding } from '@/composables/versioning/use-resource-version-landing'
  import { wafService } from '@/services/v2/waf/waf-service'
  import { wafVersionService } from '@/services/v2/waf/waf-version-service'

  defineOptions({ name: 'waf-v6-edit-view' })

  const {
    resource,
    resourceId,
    isLoading,
    loadError,
    latestVersionId,
    activeTab,
    handleCommandSuccess,
    handleCommandError,
    handleCancel
  } = useResourceVersionLanding({
    load: (id) => wafService.loadWafRule({ id }),
    provideKey: 'waf',
    versionService: wafVersionService,
    resourceType: 'waf',
    routeName: 'edit-waf-rules',
    versionRouteName: 'edit-waf-rules-version'
  })

  const pageDescription =
    'Each version is an isolated snapshot of this WAF configuration. Edit a draft, then build it to publish an immutable version.'
</script>

<template>
  <ResourceVersionLanding
    v-model:active-tab="activeTab"
    :is-loading="isLoading"
    :load-error="loadError"
    :title="resource?.name ?? ''"
    :description="pageDescription"
    :entity-name="resource?.name"
    error-message="Failed to load WAF. Try refreshing the page."
    :latest-version-id="latestVersionId"
    empty-state-description="Create a version on the Versions tab to start configuring this WAF."
    testid-prefix="waf-v6-edit"
  >
    <template #versions>
      <VersionsTab :waf-id="resourceId" />
    </template>
    <template #settings>
      <MainSettingsTab
        :key="latestVersionId"
        :waf="resource"
        :resource-id="resourceId"
        :version-id="latestVersionId"
        @command-success="handleCommandSuccess"
        @command-error="handleCommandError"
        @cancel="handleCancel"
      />
    </template>
  </ResourceVersionLanding>
</template>
