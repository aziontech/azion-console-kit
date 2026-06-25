<script setup>
  // VersionEditView — the FULL version editor screen for a Network List, gated by
  // `use_v6_configurations`. Logic lives in useVersionEditScreen; chrome in
  // VersionEditScreen. This view only wires the Network List config + editor tabs.
  import VersionEditScreen from '@/templates/version-shell-block/VersionEditScreen.vue'
  import VersionEditorTabs from '@/views/NetworkLists/v6/tabs/VersionEditorTabs.vue'
  import { useVersionEditScreen } from '@/composables/versioning/use-version-edit-screen'
  import { networkListsService } from '@/services/v2/network-lists/network-lists-service'

  defineOptions({ name: 'network-lists-v6-version-edit-view' })

  // Countries dropdown loader forwarded to the form fields; supplied by the route.
  defineProps({
    listCountriesService: { type: Function, required: true }
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
    load: (id) => networkListsService.loadNetworkList({ id }),
    provideKey: 'networkList',
    listRoute: (id) => ({ name: 'edit-network-lists', params: { id } }),
    versionRouteName: 'edit-network-lists-version'
  })
</script>

<template>
  <VersionEditScreen
    :is-loading="isLoading"
    :load-error="loadError"
    :title="title"
    :entity-name="resource?.name"
    error-message="Failed to load network list. Try refreshing the page."
    :has-add-action="true"
    testid-prefix="network-lists-v6-version-edit"
  >
    <template #editor>
      <VersionEditorTabs
        v-if="versionId"
        ref="editorRef"
        :key="versionId"
        :network-list="resource"
        :resource-id="resourceId"
        :version-id="versionId"
        :list-countries-service="listCountriesService"
        @command-success="handleCommandSuccess"
        @command-error="handleCommandError"
        @cancel="handleCancel"
      />
    </template>
  </VersionEditScreen>
</template>
