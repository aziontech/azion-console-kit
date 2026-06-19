<script setup>
  // VersionEditView — the FULL version editor screen for a Custom Page, gated by
  // `use_v6_configurations`. Logic lives in useVersionEditScreen; chrome in
  // VersionEditScreen. This view only wires the Custom Page config + editor tabs.
  import VersionEditScreen from '@/templates/version-shell-block/VersionEditScreen.vue'
  import VersionEditorTabs from '@/views/CustomPages/v6/tabs/VersionEditorTabs.vue'
  import { useVersionEditScreen } from '@/composables/versioning/use-version-edit-screen'
  import { customPageService } from '@/services/v2/custom-page/custom-page-service'

  defineOptions({ name: 'custom-pages-v6-version-edit-view' })

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
    load: (id) => customPageService.loadCustomPagesService({ id }),
    provideKey: 'customPage',
    listRoute: (id) => ({ name: 'edit-custom-pages', params: { id } }),
    versionRouteName: 'edit-custom-pages-version'
  })
</script>

<template>
  <VersionEditScreen
    :is-loading="isLoading"
    :load-error="loadError"
    :title="title"
    :entity-name="resource?.name"
    error-message="Failed to load custom page. Try refreshing the page."
    :has-add-action="true"
    testid-prefix="custom-pages-v6-version-edit"
  >
    <template #editor>
      <VersionEditorTabs
        v-if="versionId"
        ref="editorRef"
        :key="versionId"
        :custom-page="resource"
        :resource-id="resourceId"
        :version-id="versionId"
        @command-success="handleCommandSuccess"
        @command-error="handleCommandError"
        @cancel="handleCancel"
      />
    </template>
  </VersionEditScreen>
</template>
