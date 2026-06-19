<script setup>
  // VersionEditView — the FULL version editor screen for a Workload. Logic lives in
  // useVersionEditScreen; chrome in VersionEditScreen. Workload deploys via its own
  // legacy flow, so there is no deploy drawer (supportsDeployDrawer: false), no
  // resource provide, and a bare title.
  import VersionEditScreen from '@/templates/version-shell-block/VersionEditScreen.vue'
  import WorkloadSettingsTab from '@/views/Workload/v6/WorkloadSettingsTab.vue'
  import { useVersionEditScreen } from '@/composables/versioning/use-version-edit-screen'
  import { workloadService } from '@/services/v2/workload/workload-service'

  defineOptions({ name: 'workload-v6-version-edit-view' })

  const {
    resource,
    resourceId,
    versionId,
    isLoading,
    loadError,
    title,
    handleCommandSuccess,
    handleCommandError,
    handleCancel
  } = useVersionEditScreen({
    load: (id) => workloadService.loadWorkload({ id }),
    listRoute: (id) => ({ name: 'edit-workload', params: { id, tab: 'versions' } }),
    versionRouteName: 'edit-workload-version',
    titleWithVersion: false,
    supportsDeployDrawer: false
  })
</script>

<template>
  <VersionEditScreen
    :is-loading="isLoading"
    :load-error="loadError"
    :title="title"
    :entity-name="resource?.name"
    error-message="Failed to load workload. Try refreshing the page."
    testid-prefix="workload-v6-version-edit"
  >
    <template #editor>
      <WorkloadSettingsTab
        v-if="resource && versionId"
        :key="versionId"
        :workload="resource"
        :resource-id="resourceId"
        :version-id="versionId"
        @command-success="handleCommandSuccess"
        @command-error="handleCommandError"
        @cancel="handleCancel"
      />
    </template>
  </VersionEditScreen>
</template>
