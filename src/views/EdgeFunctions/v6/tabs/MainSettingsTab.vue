<script setup>
  // MainSettingsTab — the "Settings" outer tab of EditView for an Edge Function.
  // Wraps FormFieldsEditEdgeFunctions in VersionShell → EdgeFunctionVersionAdapter so
  // the form binds to the latest version and lifecycle actions work. Owns no routing
  // or toast: commands bubble up; EditView decides navigation + toast.
  import EdgeFunctionVersionAdapter from '@/views/EdgeFunctions/v6/EdgeFunctionVersionAdapter.vue'
  import VersionHeadingActions from '@/templates/version-shell-block/components/VersionHeadingActions.vue'
  import VersionShell from '@/templates/version-shell-block/index.vue'
  import FormFieldsEditEdgeFunctions from '@/views/EdgeFunctions/FormFields/FormFieldsEditEdgeFunctions.vue'
  import { edgeFunctionVersionService } from '@/services/v2/edge-function/edge-function-version-service'
  import { useDeployResourceContext } from '@/composables/versioning/use-deploy-resource-context'

  defineOptions({ name: 'edge-functions-v6-main-settings-tab' })

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
</script>

<template>
  <VersionShell
    :use-version-query="useVersionQuery"
    :resource-id="resourceId"
    :version-id="versionId"
    data-testid="edge-functions-v6-main-settings__shell"
    @updated="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  >
    <EdgeFunctionVersionAdapter
      :resource="edgeFunction"
      :resource-id="resourceId"
      :version-id="versionId"
    >
      <div class="relative">
        <FormFieldsEditEdgeFunctions class="flex gap-4" />
        <VersionHeadingActions :resource-context="resourceContext" />
      </div>
    </EdgeFunctionVersionAdapter>
  </VersionShell>
</template>
