<script setup>
  // VersionEditView — the FULL version editor screen for a Firewall, gated by
  // `use_v6_configurations`. Logic lives in useVersionEditScreen; chrome in
  // VersionEditScreen. This view only wires the Firewall config + editor tabs.
  import VersionEditScreen from '@/templates/version-shell-block/VersionEditScreen.vue'
  import VersionEditorTabs from '@/views/EdgeFirewall/v6/tabs/VersionEditorTabs.vue'
  import { useVersionEditScreen } from '@/composables/versioning/use-version-edit-screen'
  import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'

  defineOptions({ name: 'firewall-v6-version-edit-view' })

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
    load: (id) => edgeFirewallService.loadEdgeFirewallService({ id }),
    provideKey: 'edgeFirewall',
    listRoute: (id) => ({ name: 'edit-firewall', params: { id } }),
    versionRouteName: 'edit-firewall-version'
  })
</script>

<template>
  <VersionEditScreen
    :is-loading="isLoading"
    :load-error="loadError"
    :title="title"
    :entity-name="resource?.name"
    error-message="Failed to load firewall. Try refreshing the page."
    :has-add-action="true"
    testid-prefix="firewall-v6-version-edit"
  >
    <template #editor>
      <VersionEditorTabs
        v-if="versionId"
        ref="editorRef"
        :key="versionId"
        :firewall="resource"
        :resource-id="resourceId"
        :version-id="versionId"
        @command-success="handleCommandSuccess"
        @command-error="handleCommandError"
        @cancel="handleCancel"
      />
    </template>
  </VersionEditScreen>
</template>
