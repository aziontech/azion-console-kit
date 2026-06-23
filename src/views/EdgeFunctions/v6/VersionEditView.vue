<script setup>
  // VersionEditView — the FULL version editor screen for an Edge Function, gated by
  // `use_v6_configurations`. Logic lives in useVersionEditScreen; chrome in
  // VersionEditScreen. This view only wires the Edge Function config + editor tabs.
  import VersionEditScreen from '@/templates/version-shell-block/VersionEditScreen.vue'
  import VersionEditorTabs from '@/views/EdgeFunctions/v6/tabs/VersionEditorTabs.vue'
  import { useVersionEditScreen } from '@/composables/versioning/use-version-edit-screen'
  import { edgeFunctionService } from '@/services/v2/edge-function/edge-function-service'

  defineOptions({ name: 'edge-functions-v6-version-edit-view' })

  const {
    resource,
    resourceId,
    versionId,
    isLoading,
    loadError,
    title,
    editorRef,
    handleCommandSuccess,
    handleCommandError,
    handleCancel
  } = useVersionEditScreen({
    load: (id) => edgeFunctionService.loadEdgeFunctionService({ id }),
    provideKey: 'edgeFunction',
    listRoute: (id) => ({ name: 'edit-functions', params: { id } }),
    versionRouteName: 'edit-functions-version',
    // Edge Function is versioned-only: no deploy drawer to open on DEPLOY.
    supportsDeployDrawer: false
  })
</script>

<template>
  <VersionEditScreen
    :is-loading="isLoading"
    :load-error="loadError"
    :title="title"
    :entity-name="resource?.name"
    error-message="Failed to load function. Try refreshing the page."
    :has-add-action="true"
    testid-prefix="edge-functions-v6-version-edit"
  >
    <template #editor>
      <VersionEditorTabs
        v-if="versionId"
        ref="editorRef"
        :key="versionId"
        :edge-function="resource"
        :resource-id="resourceId"
        :version-id="versionId"
        @command-success="handleCommandSuccess"
        @command-error="handleCommandError"
        @cancel="handleCancel"
      />
    </template>
  </VersionEditScreen>
</template>
