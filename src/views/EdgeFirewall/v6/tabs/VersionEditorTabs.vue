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
  import TabView from 'primevue/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'

  import EdgeFirewallVersionAdapter from '@/views/EdgeFirewall/v6/EdgeFirewallVersionAdapter.vue'
  import VersionShell from '@/templates/version-shell-block/index.vue'
  import FormFieldsEdgeFirewall from '@/views/EdgeFirewall/FormFields/FormFieldsEdgeFirewall.vue'
  import EdgeFirewallVersionHeadingActions from '@/views/EdgeFirewall/v6/EdgeFirewallVersionHeadingActions.vue'
  import VersionTabAddButton from '@/views/EdgeApplications/v6/tabs/VersionTabAddButton.vue'
  import EdgeFirewallFunctionsListView from '@/views/EdgeFirewallFunctions/ListView.vue'
  import EdgeFirewallRulesEngineListView from '@/views/EdgeFirewallRulesEngine/ListView.vue'

  import { useVersionedFacades } from '@/views/EdgeFirewall/v6/tabs/use-versioned-facades'
  import { documentationCatalog } from '@/helpers'
  import { edgeFirewallVersionService } from '@/services/v2/edge-firewall/edge-firewall-version-service'

  defineOptions({ name: 'edge-firewall-v6-version-editor-tabs' })

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

  const activeTabIndex = ref(0)

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

  const componentsRefs = ref({})

  const setComponentRef = (index) => (instance) => {
    if (instance) {
      componentsRefs.value[index] = instance
    } else {
      delete componentsRefs.value[index]
    }
  }

  const activeTabDescriptor = computed(() => firewallTabs.value[activeTabIndex.value] ?? null)
  const activeTabComponent = computed(() => componentsRefs.value[activeTabIndex.value] ?? null)

  const useVersionQuery = () =>
    edgeFirewallVersionService.useLoadVersionQuery(props.resourceId, props.versionId)

  const headingActionsRef = ref(null)
  const openDeployDrawer = () => headingActionsRef.value?.openDeployDrawer()

  defineExpose({ openDeployDrawer })
</script>

<template>
  <!-- Keyed by versionId at the parent: the shell calls the query factory once in
       setup and captures resourceId/versionId by value, so a version switch
       remounts shell + adapter to renew query, ctx and form. -->
  <VersionShell
    :use-version-query="useVersionQuery"
    :resource-id="resourceId"
    :version-id="versionId"
    data-testid="edge-firewall-v6-edit__shell"
    @updated="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  >
    <EdgeFirewallVersionAdapter
      :firewall="firewall"
      :resource-id="resourceId"
      :version-id="versionId"
    >
      <div class="flex align-center justify-between relative">
        <TabView
          v-model:activeIndex="activeTabIndex"
          class="flex-1"
        >
          <TabPanel
            v-for="(tab, index) in firewallTabs"
            :key="tab.key"
            :header="tab.label"
            :pt="{
              root: { 'data-testid': `edge-firewall-v6-edit__tab-panel__${tab.key}` }
            }"
          >
            <div class="flex flex-col gap-4 mt-4">
              <component
                :is="tab.component"
                :ref="setComponentRef(index)"
                v-bind="tab.props ?? {}"
              />
            </div>
          </TabPanel>
        </TabView>
        <!-- Lives in the shell slot (real readOnly) but Teleports its button to the
             page heading (#version-tab-add-action). Hidden for Main Settings and
             read-only versions. -->
        <VersionTabAddButton
          :tab="activeTabDescriptor"
          :active-component="activeTabComponent"
        />
        <!-- Shell-slot-resident + Teleported to the heading
             (#version-lifecycle-action): the version's primary action
             (Build / Deploy), gated by the injected version state. -->
        <EdgeFirewallVersionHeadingActions ref="headingActionsRef" />
      </div>
    </EdgeFirewallVersionAdapter>
  </VersionShell>
</template>
