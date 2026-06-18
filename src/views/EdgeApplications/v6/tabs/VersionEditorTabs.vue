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
  import VersionHeadingActions from '@/views/EdgeApplications/v6/VersionHeadingActions.vue'
  import EdgeApplicationsCacheSettingsListView from '@/views/EdgeApplicationsCacheSettings/ListView.vue'
  import EdgeApplicationsDeviceGroupsListView from '@/views/EdgeApplicationsDeviceGroups/ListView.vue'
  import EdgeApplicationsFunctionsListView from '@/views/EdgeApplicationsFunctions/ListView.vue'
  import EdgeApplicationsRulesEngineListView from '@/views/EdgeApplicationsRulesEngine/ListView.vue'

  import { useVersionedFacades } from '@/views/EdgeApplications/v6/tabs/use-versioned-facades'
  import { documentationCatalog } from '@/helpers'
  import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'

  defineOptions({ name: 'edge-applications-v6-version-editor-tabs' })

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
    },
    listOriginsService: {
      type: Function,
      default: null
    }
  })

  const emit = defineEmits(['command-success', 'command-error', 'cancel'])

  const facades = useVersionedFacades(props.resourceId, props.versionId)

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
        component: FormFieldsEditEdgeApplications,
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
        hideApplicationAcceleratorInDescription: isApplicationAcceleratorEnabled.value,
        navigateToApplicationAccelerator: goToMainSettingsTab,
        service: facade.rulesEngine
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

  const activeTabDescriptor = computed(() => applicationTabs.value[activeTabIndex.value] ?? null)
  const activeTabComponent = computed(() => componentsRefs.value[activeTabIndex.value] ?? null)

  const useVersionQuery = () =>
    edgeAppVersionService.useLoadVersionQuery(props.resourceId, props.versionId)
</script>

<template>
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
        <VersionTabAddButton
          :tab="activeTabDescriptor"
          :active-component="activeTabComponent"
        />
        <VersionHeadingActions />
      </div>
    </ApplicationVersionAdapter>
  </VersionShell>
</template>
