<script setup>
  import { computed, ref } from 'vue'

  import WafVersionAdapter from '@/views/WafRules/v6/WafVersionAdapter.vue'
  import VersionEditorTabsShell from '@/templates/version-shell-block/VersionEditorTabsShell.vue'
  import FormFieldsWafRules from '@/views/WafRules/FormFields/FormFieldsWafRules.vue'
  import ListWafRulesAllowed from '@/views/WafRules/ListWafRulesAllowed.vue'

  import { useVersionedFacades } from '@/views/WafRules/v6/tabs/use-versioned-facades'
  import { documentationCatalog } from '@/helpers'
  import { wafVersionService } from '@/services/v2/waf/waf-version-service'

  defineOptions({ name: 'waf-v6-version-editor-tabs' })

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

  const facades = useVersionedFacades(props.resourceId, props.versionId)
  const wafId = computed(() => String(props.resourceId))

  const wafTabs = computed(() => {
    if (!props.waf) return []

    return [
      {
        key: 'main-settings',
        label: 'Main Settings',
        component: FormFieldsWafRules,
        canCreate: false,
        props: {}
      },
      {
        key: 'allowed-rules',
        label: 'Allowed Rules',
        component: ListWafRulesAllowed,
        canCreate: true,
        addButtonLabel: 'Allowed Rule',
        props: {
          wafId: wafId.value,
          versionId: props.versionId,
          service: facades.exceptions,
          documentationServiceAllowed: documentationCatalog.wafAllowed
        }
      }
    ]
  })

  const useVersionQuery = () =>
    wafVersionService.useLoadVersionQuery(props.resourceId, props.versionId)

  const shellRef = ref(null)
  const openRelease = () => shellRef.value?.openRelease()

  defineExpose({ openRelease })
</script>

<template>
  <VersionEditorTabsShell
    ref="shellRef"
    :use-version-query="useVersionQuery"
    :resource-id="resourceId"
    :version-id="versionId"
    :resource="waf"
    :adapter="WafVersionAdapter"
    :tabs="wafTabs"
    resource-type="waf"
    :resource-context="null"
    testid-prefix="waf-v6-edit"
    @command-success="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  />
</template>
