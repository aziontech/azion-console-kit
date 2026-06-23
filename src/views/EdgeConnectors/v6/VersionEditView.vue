<script setup>
  // VersionEditView — the FULL version editor screen for a Connector, gated by
  // `use_v6_configurations`. Logic lives in useVersionEditScreen; chrome in
  // VersionEditScreen. This view only wires the Connector config + editor tabs.
  import VersionEditScreen from '@/templates/version-shell-block/VersionEditScreen.vue'
  import VersionEditorTabs from '@/views/EdgeConnectors/v6/tabs/VersionEditorTabs.vue'
  import { useVersionEditScreen } from '@/composables/versioning/use-version-edit-screen'
  import { edgeConnectorsService } from '@/services/v2/edge-connectors/edge-connectors-service'

  defineOptions({ name: 'edge-connectors-v6-version-edit-view' })

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
    load: (id) => edgeConnectorsService.loadEdgeConnectorsService({ id }),
    provideKey: 'edgeConnector',
    listRoute: (id) => ({ name: 'edit-connectors', params: { id } }),
    versionRouteName: 'edit-connectors-version'
  })
</script>

<template>
  <VersionEditScreen
    :is-loading="isLoading"
    :load-error="loadError"
    :title="title"
    :entity-name="resource?.name"
    error-message="Failed to load connector. Try refreshing the page."
    testid-prefix="edge-connectors-v6-version-edit"
  >
    <template #editor>
      <VersionEditorTabs
        v-if="versionId"
        ref="editorRef"
        :key="versionId"
        :connector="resource"
        :resource-id="resourceId"
        :version-id="versionId"
        @command-success="handleCommandSuccess"
        @command-error="handleCommandError"
        @cancel="handleCancel"
      />
    </template>
  </VersionEditScreen>
</template>
