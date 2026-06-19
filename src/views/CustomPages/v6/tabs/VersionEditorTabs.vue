<script setup>
  // VersionEditorTabs — the version editor body for a Custom Page (atomic: a single
  // Main Settings tab). Delegates the scaffold to the shared VersionEditorTabsShell;
  // only the tab descriptor + deploy context specialize.
  import { ref } from 'vue'
  import CustomPageVersionAdapter from '@/views/CustomPages/v6/CustomPageVersionAdapter.vue'
  import VersionEditorTabsShell from '@/templates/version-shell-block/VersionEditorTabsShell.vue'
  import FormFieldsCustomPages from '@/views/CustomPages/FormFields/CustomPages.vue'
  import { customPageVersionService } from '@/services/v2/custom-page/custom-page-version-service'
  import { useDeployResourceContext } from '@/composables/versioning/use-deploy-resource-context'

  defineOptions({ name: 'custom-pages-v6-version-editor-tabs' })

  const props = defineProps({
    customPage: {
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
    }
  })

  const emit = defineEmits(['command-success', 'command-error', 'cancel'])

  const useVersionQuery = () =>
    customPageVersionService.useLoadVersionQuery(props.resourceId, props.versionId)

  const { resourceContext } = useDeployResourceContext({
    resourceType: 'custom_page',
    injectionKey: 'customPage',
    versionService: customPageVersionService
  })

  // Atomic resource: a single Main Settings tab, no "+ Add".
  const customPageTabs = [
    {
      key: 'main-settings',
      label: 'Main Settings',
      component: FormFieldsCustomPages,
      canCreate: false,
      props: {}
    }
  ]

  const shellRef = ref(null)
  const openDeployDrawer = () => shellRef.value?.openDeployDrawer()

  defineExpose({ openDeployDrawer })
</script>

<template>
  <VersionEditorTabsShell
    ref="shellRef"
    :use-version-query="useVersionQuery"
    :resource-id="resourceId"
    :version-id="versionId"
    :resource="customPage"
    :adapter="CustomPageVersionAdapter"
    :tabs="customPageTabs"
    :resource-context="resourceContext"
    testid-prefix="custom-pages-v6-edit"
    @command-success="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  />
</template>
