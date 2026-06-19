<script setup>
  /**
   * MainSettingsTab — the "Settings" outer tab of the Firewall v6 EditView.
   *
   * Shows ONLY the Main Settings form of a version (the latest, resolved by the
   * container) wrapped in VersionShell + EdgeFirewallVersionAdapter, so the form
   * binds to the version and the lifecycle actions work on the latest version.
   * The shell decides editability from the state. Owns NO routing/toast.
   */
  import EdgeFirewallVersionAdapter from '@/views/EdgeFirewall/v6/EdgeFirewallVersionAdapter.vue'
  import VersionShell from '@/templates/version-shell-block/index.vue'
  import FormFieldsEdgeFirewall from '@/views/EdgeFirewall/FormFields/FormFieldsEdgeFirewall.vue'
  import EdgeFirewallVersionHeadingActions from '@/views/EdgeFirewall/v6/EdgeFirewallVersionHeadingActions.vue'
  import { edgeFirewallVersionService } from '@/services/v2/edge-firewall/edge-firewall-version-service'

  defineOptions({ name: 'edge-firewall-v6-main-settings-tab' })

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
</script>

<template>
  <VersionShell
    :use-version-query="useVersionQuery"
    :resource-id="resourceId"
    :version-id="versionId"
    data-testid="edge-firewall-v6-main-settings__shell"
    @updated="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  >
    <EdgeFirewallVersionAdapter
      :firewall="firewall"
      :resource-id="resourceId"
      :version-id="versionId"
    >
      <div class="relative">
        <FormFieldsEdgeFirewall class="flex gap-4" />
        <EdgeFirewallVersionHeadingActions />
      </div>
    </EdgeFirewallVersionAdapter>
  </VersionShell>
</template>
