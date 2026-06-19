<script setup>
  /**
   * VersionEditorTabs — the FULL version editor body for Edge Firewall.
   *
   * Rendered by VersionEditView. Edits ONE version across Main Settings,
   * Functions Instances (gated by edge_functions_enabled in the version config)
   * and Rules Engine. The VersionShell derives editability from the version
   * state; sub-resource tabs receive a versioned `service` facade (drop-in).
   *
   * Owns NO routing/toast: lifecycle commands bubble up as
   * `command-success`/`command-error`/`cancel`. Keyed by versionId at the parent.
   */
  import { computed, ref } from 'vue'

  import FirewallVersionAdapter from '@/views/EdgeFirewall/v6/FirewallVersionAdapter.vue'
  import VersionEditorTabsShell from '@/templates/version-shell-block/VersionEditorTabsShell.vue'
  import FormFieldsEdgeFirewall from '@/views/EdgeFirewall/FormFields/FormFieldsEdgeFirewall.vue'
  import EdgeFirewallFunctionsListView from '@/views/EdgeFirewallFunctions/ListView.vue'
  import EdgeFirewallRulesEngineListView from '@/views/EdgeFirewallRulesEngine/ListView.vue'

  import { useVersionedFacades } from '@/views/EdgeFirewall/v6/tabs/use-versioned-facades'
  import { useDeployResourceContext } from '@/composables/versioning/use-deploy-resource-context'
  import { documentationCatalog } from '@/helpers'
  import { edgeFirewallVersionService } from '@/services/v2/edge-firewall/edge-firewall-version-service'

  defineOptions({ name: 'firewall-v6-version-editor-tabs' })

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

  // Per-resource facades pre-bound to (firewallId, versionId). Built once: the
  // parent keys this component by versionId, so it remounts on a version switch.
  const facades = useVersionedFacades(props.resourceId, props.versionId)
  const firewallId = computed(() => String(props.resourceId))

  // Module enablement gates the Functions tab. Read from the VERSION config merged
  // over the parent Firewall (same precedence Main Settings uses), via the same
  // vue-query the shell uses (deduped by queryKey, no extra request).
  const versionModuleQuery = edgeFirewallVersionService.useLoadVersionQuery(
    props.resourceId,
    props.versionId
  )
  const moduleSource = computed(() => ({
    ...(props.firewall ?? {}),
    ...(versionModuleQuery.data.value?.config ?? {})
  }))
  const isEdgeFunctionEnabled = computed(() => !!moduleSource.value.edgeFunctionsEnabled)

  const firewallTabs = computed(() => {
    if (!props.firewall) return []

    const tabs = [
      {
        key: 'main-settings',
        label: 'Main Settings',
        component: FormFieldsEdgeFirewall,
        canCreate: false,
        props: {}
      }
    ]

    if (isEdgeFunctionEnabled.value) {
      tabs.push({
        key: 'functions',
        label: 'Functions Instances',
        component: EdgeFirewallFunctionsListView,
        canCreate: true,
        addButtonLabel: 'Function',
        props: {
          edgeFirewallID: firewallId.value,
          versionId: props.versionId,
          service: facades.functions,
          loadFunctionService: facades.functions.load,
          listEdgeFunctionsService: facades.functions.list,
          loadEdgeFunctionService: facades.functions.load,
          createFunctionService: facades.functions.create,
          editFunctionService: facades.functions.edit,
          deleteFunctionService: facades.functions.remove
        }
      })
    }

    tabs.push({
      key: 'rules-engine',
      label: 'Rules Engine',
      component: EdgeFirewallRulesEngineListView,
      canCreate: true,
      addButtonLabel: 'Rule',
      props: {
        edgeFirewallId: firewallId.value,
        service: facades.rulesEngine,
        documentationService: documentationCatalog.edgeFirewallRulesEngine,
        createEdgeFirewallRulesEngineService:
          facades.rulesEngine.createEdgeFirewallRulesEngineService,
        editEdgeFirewallRulesEngineService: facades.rulesEngine.editEdgeFirewallRulesEngineService,
        loadEdgeFirewallRulesEngineService: facades.rulesEngine.loadEdgeFirewallRulesEngineService,
        reorderRulesEngine: facades.rulesEngine.reorderEdgeFirewallRulesEngineService,
        listFunctionsService: facades.functions.list
      }
    })

    return tabs
  })

  const useVersionQuery = () =>
    edgeFirewallVersionService.useLoadVersionQuery(props.resourceId, props.versionId)

  // The deploy `resourceContext` (ready versions of this Firewall) feeds the shared
  // heading's DeployDrawerBlock.
  const { resourceContext } = useDeployResourceContext({
    resourceType: 'firewall',
    injectionKey: 'edgeFirewall',
    versionService: edgeFirewallVersionService,
    currentVersionId: () => props.versionId
  })

  // Forward the editor shell's openDeployDrawer so VersionEditView can open the
  // SAME drawer when the VersionShell footer dispatches DEPLOY.
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
    :resource="firewall"
    :adapter="FirewallVersionAdapter"
    :tabs="firewallTabs"
    :resource-context="resourceContext"
    testid-prefix="firewall-v6-edit"
    @command-success="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  />
</template>
