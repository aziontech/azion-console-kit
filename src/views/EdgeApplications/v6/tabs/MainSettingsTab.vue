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
  import ApplicationVersionHeadingActions from '@/views/EdgeApplications/v6/ApplicationVersionHeadingActions.vue'
  import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'

  defineOptions({ name: 'edge-applications-v6-main-settings-tab' })

  const props = defineProps({
    // Parent Application — the form's base values; merged under the version config.
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

  // Factory passed to VersionShell. Defined in setup (not inline in the template)
  // because, inside template function literals, refs are not auto-unwrapped.
  const useVersionQuery = () =>
    edgeAppVersionService.useLoadVersionQuery(props.resourceId, props.versionId)
</script>

<template>
  <!-- Keyed by versionId at the parent: the shell captures resourceId/versionId by
       value, so a version switch remounts shell + adapter + form. -->
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
        <!-- Shell-slot-resident + Teleported to the heading (#version-lifecycle-action):
             the version's status + primary action (Build when draft / Deploy when ready). -->
        <ApplicationVersionHeadingActions />
      </div>
    </ApplicationVersionAdapter>
  </VersionShell>
</template>
