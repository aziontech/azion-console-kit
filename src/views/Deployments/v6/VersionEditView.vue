<script setup>
  // VersionEditView — the FULL version editor screen for a Deployment. Logic lives
  // in useVersionEditScreen; chrome in VersionEditScreen. The form body is
  // FormFieldsDeployment (loaded from the deployment stream), governed read-only by
  // the version shell. Deploying is owned elsewhere, so there is no deploy drawer.
  import VersionEditScreen from '@/templates/version-shell-block/VersionEditScreen.vue'
  import DeploymentVersionEditor from '@/views/Deployments/v6/DeploymentVersionEditor.vue'
  import { useVersionEditScreen } from '@/composables/versioning/use-version-edit-screen'
  import { loadDeploymentByIdAdapter } from '@/views/Deployments/Config/adapters'

  defineOptions({ name: 'deployment-v6-version-edit-view' })

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
    load: (id) => loadDeploymentByIdAdapter({ id }),
    listRoute: (id) => ({ name: 'deployments-edit', params: { id, tab: 'versions' } }),
    versionRouteName: 'edit-deployment-version',
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
    error-message="Failed to load deployment. Try refreshing the page."
    testid-prefix="deployment-v6-version-edit"
  >
    <template #editor>
      <DeploymentVersionEditor
        v-if="resource && versionId"
        :key="versionId"
        :deployment="resource"
        :resource-id="resourceId"
        :version-id="versionId"
        @command-success="handleCommandSuccess"
        @command-error="handleCommandError"
        @cancel="handleCancel"
      />
    </template>
  </VersionEditScreen>
</template>
