<script setup>
  import FirewallVersionAdapter from '@/views/EdgeFirewall/v6/FirewallVersionAdapter.vue'
  import VersionShell from '@/templates/version-shell-block/index.vue'
  import FormFieldsEdgeFirewall from '@/views/EdgeFirewall/FormFields/FormFieldsEdgeFirewall.vue'
  import VersionHeadingActions from '@/templates/version-shell-block/components/VersionHeadingActions.vue'
  import { edgeFirewallVersionService } from '@/services/v2/edge-firewall/edge-firewall-version-service'
  import { useDeployResourceContext } from '@/composables/versioning/use-deploy-resource-context'

  defineOptions({ name: 'firewall-v6-main-settings-tab' })

  const props = defineProps({
    firewall: {
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
    edgeFirewallVersionService.useLoadVersionQuery(props.resourceId, props.versionId)

  const { resourceContext } = useDeployResourceContext({
    resourceType: 'firewall',
    injectionKey: 'edgeFirewall',
    versionService: edgeFirewallVersionService,
    currentVersionId: () => props.versionId
  })
</script>

<template>
  <VersionShell
    :use-version-query="useVersionQuery"
    :resource-id="resourceId"
    :version-id="versionId"
    data-testid="firewall-v6-main-settings__shell"
    @updated="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  >
    <FirewallVersionAdapter
      :resource="firewall"
      :resource-id="resourceId"
      :version-id="versionId"
    >
      <div class="relative">
        <div class="flex flex-col gap-4"><FormFieldsEdgeFirewall /></div>
        <VersionHeadingActions :resource-context="resourceContext" />
      </div>
    </FirewallVersionAdapter>
  </VersionShell>
</template>
