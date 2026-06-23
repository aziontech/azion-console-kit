<script setup>
  /**
   * VersionEditorTabs — the FULL version editor body for WAF.
   *
   * Rendered by VersionEditView. Edits ONE version across Main Settings and
   * Allowed Rules. The VersionShell derives editability from the version state;
   * the Allowed Rules tab receives a versioned `service` facade (drop-in).
   *
   * Owns NO routing/toast: lifecycle commands bubble up as
   * `command-success`/`command-error`/`cancel`. Keyed by versionId at the parent.
   */
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

  // Per-resource facades pre-bound to (wafId, versionId). Built once: the parent
  // keys this component by versionId, so it remounts on a version switch.
  const facades = useVersionedFacades(props.resourceId, props.versionId)
  const wafId = computed(() => String(props.resourceId))

  // Version editor scope = Main Settings + Allowed Rules only. Tuning (attack
  // analysis/learning) is NOT part of the version snapshot, so it is excluded
  // here; it stays reachable only outside the version context (legacy TabsView).
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

  // WAF is versioned-only: no Deploy/Promote/Rollback. The shell resolves this
  // from resourceType="waf", so no deploy context is built nor a drawer mounted.
  const shellRef = ref(null)
  const openDeployDrawer = () => shellRef.value?.openDeployDrawer()

  defineExpose({ openDeployDrawer })
</script>

<template>
  <!-- Keyed by versionId at the parent: the shell calls the query factory once in
       setup and captures resourceId/versionId by value, so a version switch
       remounts shell + adapter to renew query, ctx and form. -->
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
