<script setup>
  // VersionEditorTabs — the version editor body for an Edge Function (atomic: a single
  // Main Settings tab). Delegates the scaffold to the shared VersionEditorTabsShell;
  // only the tab descriptor + deploy context specialize.
  import { ref } from 'vue'
  import EdgeFunctionVersionAdapter from '@/views/EdgeFunctions/v6/EdgeFunctionVersionAdapter.vue'
  import VersionEditorTabsShell from '@/templates/version-shell-block/VersionEditorTabsShell.vue'
  import FormFieldsEditEdgeFunctions from '@/views/EdgeFunctions/FormFields/FormFieldsEditEdgeFunctions.vue'
  import { edgeFunctionVersionService } from '@/services/v2/edge-function/edge-function-version-service'
  import { useDeployResourceContext } from '@/composables/versioning/use-deploy-resource-context'

  defineOptions({ name: 'edge-functions-v6-version-editor-tabs' })

  const props = defineProps({
    edgeFunction: {
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
    edgeFunctionVersionService.useLoadVersionQuery(props.resourceId, props.versionId)

  const { resourceContext } = useDeployResourceContext({
    resourceType: 'function',
    injectionKey: 'edgeFunction',
    versionService: edgeFunctionVersionService,
    currentVersionId: () => props.versionId
  })

  // The Function form already provides its own tabs (Main Settings/Code/Arguments),
  // so render it bare (no outer Main Settings tab) to avoid a duplicate tab strip.
  const edgeFunctionTabs = [
    {
      key: 'main-settings',
      label: 'Main Settings',
      component: FormFieldsEditEdgeFunctions,
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
    :resource="edgeFunction"
    :adapter="EdgeFunctionVersionAdapter"
    :tabs="edgeFunctionTabs"
    bare
    :resource-context="resourceContext"
    testid-prefix="edge-functions-v6-edit"
    @command-success="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  />
</template>
