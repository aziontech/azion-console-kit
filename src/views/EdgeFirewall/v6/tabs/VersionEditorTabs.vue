<script setup>
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

  const facades = useVersionedFacades(props.resourceId, props.versionId)
  const firewallId = computed(() => String(props.resourceId))

  const versionModuleQuery = edgeFirewallVersionService.useLoadVersionQuery(
    props.resourceId,
    props.versionId
  )
  const moduleSource = computed(() => ({
    ...(props.firewall ?? {}),
    ...(versionModuleQuery.data.value?.config ?? {})
  }))
  const isEdgeFunctionEnabled = computed(() => !!moduleSource.value.edgeFunctionsEnabled)

  const onCommandSuccess = (event) => {
    if (event?.action === 'SAVE') versionModuleQuery.refetch?.()
    emit('command-success', event)
  }

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
        enabledModules: {
          webApplicationFirewall: !!moduleSource.value.wafEnabled,
          networkProtectionLayer: !!moduleSource.value.networkProtectionEnabled,
          edgeFunctions: !!moduleSource.value.edgeFunctionsEnabled,
          debugRules: !!moduleSource.value.debugRules
        },
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

  const { resourceContext } = useDeployResourceContext({
    resourceType: 'firewall',
    injectionKey: 'edgeFirewall',
    versionService: edgeFirewallVersionService,
    currentVersionId: () => props.versionId
  })

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
    :resource="firewall"
    :adapter="FirewallVersionAdapter"
    :tabs="firewallTabs"
    :resource-context="resourceContext"
    testid-prefix="firewall-v6-edit"
    @command-success="onCommandSuccess"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  />
</template>
