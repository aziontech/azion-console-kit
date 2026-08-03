<script setup>
  import { computed, ref } from 'vue'

  import ApplicationVersionAdapter from '@/views/EdgeApplications/v6/ApplicationVersionAdapter.vue'
  import VersionEditorTabsShell from '@/templates/version-shell-block/VersionEditorTabsShell.vue'
  import FormFieldsEditEdgeApplications from '@/views/EdgeApplications/FormFields/FormFieldsEditEdgeApplications.vue'
  import EdgeApplicationsCacheSettingsListView from '@/views/EdgeApplicationsCacheSettings/ListView.vue'
  import EdgeApplicationsDeviceGroupsListView from '@/views/EdgeApplicationsDeviceGroups/ListView.vue'
  import EdgeApplicationsFunctionsListView from '@/views/EdgeApplicationsFunctions/ListView.vue'
  import EdgeApplicationsRulesEngineListView from '@/views/EdgeApplicationsRulesEngine/ListView.vue'

  import { useVersionedFacades } from '@/views/EdgeApplications/v6/tabs/use-versioned-facades'
  import { useDeployResourceContext } from '@/composables/versioning/use-deploy-resource-context'
  import { documentationCatalog } from '@/helpers'
  import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'

  defineOptions({ name: 'application-v6-version-editor-tabs' })

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

  const onCommandSuccess = (event) => {
    if (event?.action === 'SAVE') versionModuleQuery.refetch?.()
    emit('command-success', event)
  }

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

  const useVersionQuery = () =>
    edgeAppVersionService.useLoadVersionQuery(props.resourceId, props.versionId)

  const { resourceContext } = useDeployResourceContext({
    resourceType: 'application',
    injectionKey: 'edgeApplication',
    versionService: edgeAppVersionService,
    currentVersionId: () => props.versionId
  })

  const shellRef = ref(null)
  const openRelease = () => shellRef.value?.openRelease()

  defineExpose({ openRelease })
</script>

<template>
  <VersionEditorTabsShell
    ref="shellRef"
    v-model:active-tab-index="activeTabIndex"
    :use-version-query="useVersionQuery"
    :resource-id="resourceId"
    :version-id="versionId"
    :resource="application"
    :adapter="ApplicationVersionAdapter"
    :tabs="applicationTabs"
    :resource-context="resourceContext"
    testid-prefix="application-v6-edit"
    @command-success="onCommandSuccess"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  />
</template>
