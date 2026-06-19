<script setup>
  /**
   * VersionEditorTabs — the FULL version editor body (all configuration tabs).
   *
   * Rendered by VersionEditView (the dedicated edit screen at
   * `edit-application-version`), reached by clicking a version in the listing.
   * It edits ONE version (`versionId`) across every sub-resource tab: Main
   * Settings, Cache Settings, Device Groups, Functions (gated), Rules Engine.
   *
   * The VersionShell decides editability from the version state: a `draft` is
   * editable; an immutable state (`ready`/`active`/`archived`) renders the whole
   * editor read-only — no extra logic here.
   *
   * It owns NO routing and NO toast: lifecycle commands emitted by the shell are
   * forwarded up as `command-success` / `command-error` / `cancel`; VersionEditView
   * decides navigation and the toast. The parent keys this component by `versionId`,
   * so it remounts on a version switch — facades and the query are built once.
   */
  import { computed, ref } from 'vue'
  import TabView from 'primevue/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'

  import ApplicationVersionAdapter from '@/views/EdgeApplications/v6/ApplicationVersionAdapter.vue'
  import VersionShell from '@/templates/version-shell-block/index.vue'
  import FormFieldsEditEdgeApplications from '@/views/EdgeApplications/FormFields/FormFieldsEditEdgeApplications.vue'
  import VersionTabAddButton from '@/views/EdgeApplications/v6/tabs/VersionTabAddButton.vue'
  import ApplicationVersionHeadingActions from '@/views/EdgeApplications/v6/ApplicationVersionHeadingActions.vue'
  import EdgeApplicationsCacheSettingsListView from '@/views/EdgeApplicationsCacheSettings/ListView.vue'
  import EdgeApplicationsDeviceGroupsListView from '@/views/EdgeApplicationsDeviceGroups/ListView.vue'
  import EdgeApplicationsFunctionsListView from '@/views/EdgeApplicationsFunctions/ListView.vue'
  import EdgeApplicationsRulesEngineListView from '@/views/EdgeApplicationsRulesEngine/ListView.vue'

  import { useVersionedFacades } from '@/views/EdgeApplications/v6/tabs/use-versioned-facades'
  import { documentationCatalog } from '@/helpers'
  import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'

  defineOptions({ name: 'edge-applications-v6-version-editor-tabs' })

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
    },
    // Legacy origins service injected by the router (no direct HTTP in the view).
    // Consumed by the versioned Rules tab.
    listOriginsService: {
      type: Function,
      default: null
    }
  })

  const emit = defineEmits(['command-success', 'command-error', 'cancel'])

  // Per-resource facades pre-bound to (appId, versionId). Built once: the parent
  // keys this component by `versionId`, so it remounts on a version switch.
  const facades = useVersionedFacades(props.resourceId, props.versionId)

  // --- Module enablement (drives Functions tab gating + Rules criteria/warnings) ---
  // The versioned sub-resources depend on the VERSION's modules, not the live
  // Application's: modules toggled in Main Settings (and persisted via SAVE) live
  // in the version `config`, while the live Application only changes on
  // build/promote. So we read the version config MERGED over the Application
  // (same precedence the Main Settings form uses), with the Application as the
  // fallback for keys the version snapshot omits. Same vue-query the shell uses
  // (deduped by queryKey), so no extra request and no validation in the shell.
  // Plain values (not getters): the parent keys this component by `versionId`,
  // so it remounts on a version switch — there is no in-place id change to track,
  // and plain args keep the query key stable. Post-mutation refetch still happens
  // because the service invalidates the version cache on every write.
  const versionModuleQuery = edgeAppVersionService.useLoadVersionQuery(
    props.resourceId,
    props.versionId
  )
  const moduleSource = computed(() => ({
    ...(props.application ?? {}),
    ...(versionModuleQuery.data.value?.config ?? {})
  }))

  const isApplicationAcceleratorEnabled = computed(
    () => !!moduleSource.value.applicationAcceleratorEnabled
  )
  const isImageOptimizationEnabled = computed(() => !!moduleSource.value.imageProcessorEnabled)
  const isEdgeFunctionEnabled = computed(() => !!moduleSource.value.edgeFunctionsEnabled)

  const activeTabIndex = ref(0)

  // Main Settings is always the first tab. Used by the Rules form CTA that asks
  // the user to enable a module (e.g. Application Accelerator) in Main Settings.
  const goToMainSettingsTab = () => {
    activeTabIndex.value = 0
  }

  const applicationTabs = computed(() => {
    if (!props.application) return []

    const facade = facades

    const tabs = [
      {
        key: 'main-settings',
        label: 'Main Settings',
        // v4 workspace form: fields connected via useField to the useForm in
        // ApplicationVersionAdapter. Default `handleBlock: ['full']` renders
        // all blocks — without legacy V3 delivery/TLS props.
        component: FormFieldsEditEdgeApplications,
        // Main Settings has no "+ Add" — it persists via the shell SAVE bus.
        canCreate: false,
        props: {}
      },
      {
        key: 'cache-settings',
        label: 'Cache Settings',
        component: EdgeApplicationsCacheSettingsListView,
        canCreate: true,
        addButtonLabel: 'Cache Setting',
        props: {
          edgeApplicationId: props.resourceId,
          versionId: props.versionId,
          service: facade.cacheSettings,
          documentationService: documentationCatalog.edgeApplicationCacheSettings,
          isApplicationAcceleratorEnabled: isApplicationAcceleratorEnabled.value,
          isTieredCacheEnabled: true
        }
      },
      {
        key: 'device-groups',
        label: 'Device Groups',
        component: EdgeApplicationsDeviceGroupsListView,
        canCreate: true,
        addButtonLabel: 'Device Group',
        props: {
          edgeApplicationId: props.resourceId,
          versionId: props.versionId,
          service: facade.deviceGroups,
          documentationService: documentationCatalog.edgeApplicationDeviceGroups
        }
      }
    ]

    // Functions tab gating (ADR §7.7 / req 1.4): only when the module is enabled.
    if (isEdgeFunctionEnabled.value) {
      tabs.push({
        key: 'functions',
        label: 'Functions',
        component: EdgeApplicationsFunctionsListView,
        canCreate: true,
        addButtonLabel: 'Function Instance',
        props: {
          edgeApplicationId: props.resourceId,
          versionId: props.versionId,
          service: facade.functions,
          documentationService: documentationCatalog.edgeApplicationFunctions
        }
      })
    }

    // Rules Engine: ONE combined tab (request + response), differentiated by
    // phase inside the table — same UX and same component as the non-versioned
    // flow. The injected `service` is a drop-in for `rulesEngineService`.
    tabs.push({
      key: 'rules-engine',
      label: 'Rules Engine',
      component: EdgeApplicationsRulesEngineListView,
      canCreate: true,
      addButtonLabel: 'Rule',
      props: {
        edgeApplicationId: props.resourceId,
        versionId: props.versionId,
        documentationService: documentationCatalog.edgeApplicationRulesEngine,
        listOriginsService: props.listOriginsService,
        isApplicationAcceleratorEnabled: isApplicationAcceleratorEnabled.value,
        isImageOptimizationEnabled: isImageOptimizationEnabled.value,
        isEdgeFunctionEnabled: isEdgeFunctionEnabled.value,
        // Drives the "- Required Application Accelerator" tags in the rule form:
        // when the accelerator module IS enabled we HIDE the warning.
        hideApplicationAcceleratorInDescription: isApplicationAcceleratorEnabled.value,
        // Lets the rule form's "enable it in Main Settings" CTA jump to that tab.
        navigateToApplicationAccelerator: goToMainSettingsTab,
        service: facade.rulesEngine
      }
    })

    return tabs
  })

  // Component instances of the rendered tabs, keyed by tab index. Used to reach
  // `openCreateDrawer` on the active tab from the "+ Add" button. An index-keyed
  // function ref keeps the mapping stable regardless of TabView's render order.
  const componentsRefs = ref({})

  const setComponentRef = (index) => (instance) => {
    if (instance) {
      componentsRefs.value[index] = instance
    } else {
      delete componentsRefs.value[index]
    }
  }

  const activeTabDescriptor = computed(() => applicationTabs.value[activeTabIndex.value] ?? null)
  const activeTabComponent = computed(() => componentsRefs.value[activeTabIndex.value] ?? null)

  // Factory passed to VersionShell. Defined in setup (not inline in the template)
  // because, inside template function literals, refs are not auto-unwrapped
  // — they require an explicit `.value`.
  const useVersionQuery = () =>
    edgeAppVersionService.useLoadVersionQuery(props.resourceId, props.versionId)

  // VersionHeadingActions owns the single DeployDrawerBlock. We forward its
  // `openDeployDrawer` upward so VersionEditView can open the SAME drawer when
  // the VersionShell footer dispatches DEPLOY — no second drawer is created.
  const headingActionsRef = ref(null)
  const openDeployDrawer = () => headingActionsRef.value?.openDeployDrawer()

  defineExpose({ openDeployDrawer })
</script>

<template>
  <!-- Keyed by versionId at the parent: the shell calls the query factory only
       once in setup and captures resourceId/versionId by value, so a version
       switch remounts shell + adapter to renew query, ctx and form. -->
  <VersionShell
    :use-version-query="useVersionQuery"
    :resource-id="resourceId"
    :version-id="versionId"
    data-testid="edge-applications-v6-edit__shell"
    @updated="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  >
    <ApplicationVersionAdapter
      :application="application"
      :resource-id="resourceId"
      :version-id="versionId"
    >
      <div class="flex align-center justify-between relative">
        <TabView
          v-model:activeIndex="activeTabIndex"
          class="flex-1"
        >
          <TabPanel
            v-for="(tab, index) in applicationTabs"
            :key="tab.key"
            :header="tab.label"
            :pt="{
              root: { 'data-testid': `edge-applications-v6-edit__tab-panel__${tab.key}` }
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
        <!-- Lives in the shell slot so it injects the real `readOnly`, but
             Teleports its button into the page heading (#version-tab-add-action),
             next to the version status. Hidden for Main Settings and read-only. -->
        <VersionTabAddButton
          :tab="activeTabDescriptor"
          :active-component="activeTabComponent"
        />
        <!-- Also shell-slot-resident + Teleported to the heading
             (#version-lifecycle-action): the version's primary action
             (Build / Deploy), gated by the injected version state. -->
        <ApplicationVersionHeadingActions ref="headingActionsRef" />
      </div>
    </ApplicationVersionAdapter>
  </VersionShell>
</template>
