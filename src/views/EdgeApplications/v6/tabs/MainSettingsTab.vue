<script setup>
  /**
   * MainSettingsTab — the "Settings" outer tab of EditView.
   *
   * Shows ONLY the Main Settings form of a version (the latest, resolved by the
   * container) — NOT the sub-resource tabs (Cache / Device Groups / Functions /
   * Rules). Those live in the full editor (VersionEditView), reached by clicking a
   * version in the listing.
   *
   * It still wraps the form in the VersionShell + ApplicationVersionAdapter so the
   * form binds to the version and the lifecycle actions (Save / Build / Deploy via
   * VersionHeadingActions + the footer action bar) work on the latest version. The
   * shell decides editability from the state: a `draft` is editable; an immutable
   * latest opens read-only.
   *
   * Owns NO routing/toast: commands bubble up as `command-success`/`command-error`/
   * `cancel`; EditView decides navigation + toast. Keyed by `versionId` at the
   * parent, so it remounts on a version switch.
   */
  import ApplicationVersionAdapter from '@/views/EdgeApplications/v6/ApplicationVersionAdapter.vue'
  import VersionShell from '@/templates/version-shell-block/index.vue'
  import FormFieldsEditEdgeApplications from '@/views/EdgeApplications/FormFields/FormFieldsEditEdgeApplications.vue'
  import VersionHeadingActions from '@/views/EdgeApplications/v6/VersionHeadingActions.vue'
  import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'

  defineOptions({ name: 'edge-applications-v6-main-settings-tab' })

  const props = defineProps({
    application: {
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
    edgeAppVersionService.useLoadVersionQuery(props.resourceId, props.versionId)
</script>

<template>
  <VersionShell
    :use-version-query="useVersionQuery"
    :resource-id="resourceId"
    :version-id="versionId"
    data-testid="edge-applications-v6-main-settings__shell"
    @updated="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  >
    <ApplicationVersionAdapter
      :application="application"
      :resource-id="resourceId"
      :version-id="versionId"
    >
      <div class="relative">
        <FormFieldsEditEdgeApplications class="flex gap-4" />
        <VersionHeadingActions />
      </div>
    </ApplicationVersionAdapter>
  </VersionShell>
</template>
