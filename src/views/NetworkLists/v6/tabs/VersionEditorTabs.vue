<script setup>
  // VersionEditorTabs — the version editor body for a Network List (atomic: a single
  // Main Settings tab; the items/type/name snapshot travels in the version).
  // Delegates the scaffold to the shared VersionEditorTabsShell; only the tab
  // descriptor specializes. network_list is versioned-only: no deploy context/drawer.
  import NetworkListVersionAdapter from '@/views/NetworkLists/v6/NetworkListVersionAdapter.vue'
  import VersionEditorTabsShell from '@/templates/version-shell-block/VersionEditorTabsShell.vue'
  import FormFieldsEditNetworkLists from '@/views/NetworkLists/FormFields/FormFieldsEditNetworkLists.vue'
  import { networkListVersionService } from '@/services/v2/network-lists/network-list-version-service'

  defineOptions({ name: 'network-lists-v6-version-editor-tabs' })

  const props = defineProps({
    networkList: {
      type: Object,
      required: true
    },
    resourceId: {
      type: [String, Number],
      required: true
    },
    versionId: {
      type: String,
      required: true
    },
    // Countries dropdown loader for the Countries network list type. Injected
    // from the route (as the legacy views do), keeping the service out of here.
    listCountriesService: {
      type: Function,
      required: true
    }
  })

  const emit = defineEmits(['command-success', 'command-error', 'cancel'])

  const useVersionQuery = () =>
    networkListVersionService.useLoadVersionQuery(props.resourceId, props.versionId)

  // Atomic resource: a single Main Settings tab, no "+ Add".
  const networkListTabs = [
    {
      key: 'main-settings',
      label: 'Main Settings',
      component: FormFieldsEditNetworkLists,
      canCreate: false,
      props: { listCountriesService: props.listCountriesService }
    }
  ]
</script>

<template>
  <VersionEditorTabsShell
    :use-version-query="useVersionQuery"
    :resource-id="resourceId"
    :version-id="versionId"
    :resource="networkList"
    :adapter="NetworkListVersionAdapter"
    :tabs="networkListTabs"
    resource-type="network_list"
    :resource-context="null"
    testid-prefix="network-lists-v6-edit"
    @command-success="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  />
</template>
