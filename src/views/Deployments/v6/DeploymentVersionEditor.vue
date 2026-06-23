<script setup>
  import DeploymentVersionAdapter from '@/views/Deployments/v6/DeploymentVersionAdapter.vue'
  import VersionHeadingActions from '@/templates/version-shell-block/components/VersionHeadingActions.vue'
  import VersionShell from '@/templates/version-shell-block/index.vue'
  import FormFieldsDeployment from '@/views/Deployments/FormFields/FormFieldsDeployment.vue'
  import { deploymentVersionService } from '@/services/v2/deployment/deployment-version-service'

  defineOptions({ name: 'deployment-v6-version-editor' })

  const props = defineProps({
    deployment: {
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
    deploymentVersionService.useLoadVersionQuery(props.resourceId, props.versionId)
</script>

<template>
  <VersionShell
    :use-version-query="useVersionQuery"
    :resource-id="resourceId"
    :version-id="versionId"
    data-testid="deployment-v6-version-editor__shell"
    @updated="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  >
    <DeploymentVersionAdapter
      :resource="deployment"
      :resource-id="resourceId"
      :version-id="versionId"
    >
      <div class="relative flex flex-col gap-8 max-md:gap-6">
        <FormFieldsDeployment isEdit />
        <VersionHeadingActions />
      </div>
    </DeploymentVersionAdapter>
  </VersionShell>
</template>
