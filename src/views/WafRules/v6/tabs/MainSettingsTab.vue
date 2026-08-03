<script setup>
  import WafVersionAdapter from '@/views/WafRules/v6/WafVersionAdapter.vue'
  import VersionShell from '@/templates/version-shell-block/index.vue'
  import FormFieldsWafRules from '@/views/WafRules/FormFields/FormFieldsWafRules.vue'
  import VersionHeadingActions from '@/templates/version-shell-block/components/VersionHeadingActions.vue'
  import { wafVersionService } from '@/services/v2/waf/waf-version-service'

  defineOptions({ name: 'waf-v6-main-settings-tab' })

  const props = defineProps({
    waf: {
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
    wafVersionService.useLoadVersionQuery(props.resourceId, props.versionId)
</script>

<template>
  <VersionShell
    :use-version-query="useVersionQuery"
    :resource-id="resourceId"
    :version-id="versionId"
    resource-type="waf"
    data-testid="waf-v6-main-settings__shell"
    @updated="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  >
    <WafVersionAdapter
      :resource="waf"
      :resource-id="resourceId"
      :version-id="versionId"
    >
      <div class="relative">
        <div class="flex flex-col gap-[var(--spacing-4)]"><FormFieldsWafRules /></div>
        <VersionHeadingActions :resource-context="null" />
      </div>
    </WafVersionAdapter>
  </VersionShell>
</template>
