<script setup>
  import WorkloadVersionAdapter from '@/views/Workload/v6/WorkloadVersionAdapter.vue'
  import VersionHeadingActions from '@/templates/version-shell-block/components/VersionHeadingActions.vue'
  import VersionShell from '@/templates/version-shell-block/index.vue'
  import FormFieldsWorkload from '@/views/Workload/FormFields/FormFieldsWorkload.vue'
  import { workloadVersionService } from '@/services/v2/workload/workload-version-service'

  defineOptions({ name: 'workload-v6-settings-tab' })

  const props = defineProps({
    workload: {
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
    workloadVersionService.useLoadVersionQuery(props.resourceId, props.versionId)
</script>

<template>
  <VersionShell
    :use-version-query="useVersionQuery"
    :resource-id="resourceId"
    :version-id="versionId"
    data-testid="workload-v6-settings__shell"
    @updated="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  >
    <WorkloadVersionAdapter
      :workload="workload"
      :resource-id="resourceId"
      :version-id="versionId"
    >
      <div class="relative flex flex-col gap-8 max-md:gap-6">
        <FormFieldsWorkload isEdit />
        <VersionHeadingActions />
      </div>
    </WorkloadVersionAdapter>
  </VersionShell>
</template>
