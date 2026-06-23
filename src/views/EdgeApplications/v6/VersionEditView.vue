<script setup>
  // VersionEditView — the FULL version editor screen for an Application, gated by
  // `use_v6_configurations`. Logic lives in useVersionEditScreen; chrome in
  // VersionEditScreen. Forwards the router-injected listOriginsService to the tabs.
  import VersionEditScreen from '@/templates/version-shell-block/VersionEditScreen.vue'
  import VersionEditorTabs from '@/views/EdgeApplications/v6/tabs/VersionEditorTabs.vue'
  import { useVersionEditScreen } from '@/composables/versioning/use-version-edit-screen'
  import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'

  defineOptions({ name: 'application-v6-version-edit-view' })

  defineProps({
    listOriginsService: {
      type: Function,
      default: null
    }
  })

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
    load: (id) => edgeAppService.loadEdgeApplicationService({ id }),
    provideKey: 'edgeApplication',
    listRoute: (id) => ({ name: 'edit-application', params: { id } }),
    versionRouteName: 'edit-application-version'
  })
</script>

<template>
  <VersionEditScreen
    :is-loading="isLoading"
    :load-error="loadError"
    :title="title"
    :entity-name="resource?.name"
    error-message="Failed to load application. Try refreshing the page."
    testid-prefix="application-v6-version-edit"
  >
    <template #editor>
      <VersionEditorTabs
        v-if="versionId"
        ref="editorRef"
        :key="versionId"
        :application="resource"
        :resource-id="resourceId"
        :version-id="versionId"
        :list-origins-service="listOriginsService"
        @command-success="handleCommandSuccess"
        @command-error="handleCommandError"
        @cancel="handleCancel"
      />
    </template>
  </VersionEditScreen>
</template>
