<script setup>
  import EdgeFunctionVersionAdapter from '@/views/EdgeFunctions/v6/EdgeFunctionVersionAdapter.vue'
  import VersionEditorTabsShell from '@/templates/version-shell-block/VersionEditorTabsShell.vue'
  import FormFieldsEditEdgeFunctions from '@/views/EdgeFunctions/FormFields/FormFieldsEditEdgeFunctions.vue'
  import { edgeFunctionVersionService } from '@/services/v2/edge-function/edge-function-version-service'

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

  const edgeFunctionTabs = [
    {
      key: 'main-settings',
      label: 'Main Settings',
      component: FormFieldsEditEdgeFunctions,
      canCreate: false,
      props: {}
    }
  ]
</script>

<template>
  <VersionEditorTabsShell
    :use-version-query="useVersionQuery"
    :resource-id="resourceId"
    :version-id="versionId"
    :resource="edgeFunction"
    :adapter="EdgeFunctionVersionAdapter"
    :tabs="edgeFunctionTabs"
    bare
    resource-type="function"
    testid-prefix="edge-functions-v6-edit"
    @command-success="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  />
</template>
