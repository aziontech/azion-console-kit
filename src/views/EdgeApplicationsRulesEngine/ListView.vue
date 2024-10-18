<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import DrawerRulesEngine from '@/views/EdgeApplicationsRulesEngine/Drawer'
  import ListTableBlock from '@/templates/list-table-block'
  import PrimeButton from 'primevue/button'
  import SelectButton from 'primevue/selectbutton'
  import { computed, ref, inject } from 'vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'list-edge-applications-device-groups-tab' })

  const props = defineProps({
    edgeApplicationId: {
      required: true,
      type: String
    },
    listRulesEngineService: {
      required: true,
      type: Function
    },
    deleteRulesEngineService: {
      required: true,
      type: Function
    },
    reorderRulesEngine: {
      required: true,
      type: Function
    },
    loadRulesEngineService: {
      required: true,
      type: Function
    },
    editRulesEngineService: {
      required: true,
      type: Function
    },
    createRulesEngineService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    },
    isApplicationAcceleratorEnabled: {
      required: true,
      type: Boolean
    },
    isDeliveryProtocolHttps: {
      required: true,
      type: Boolean
    },
    isImageOptimizationEnabled: {
      required: true,
      type: Boolean
    },
    listEdgeApplicationFunctionsService: {
      required: true,
      type: Function
    },
    listCacheSettingsService: {
      required: true,
      type: Function
    },
    listOriginsService: {
      required: true,
      type: Function
    },
    hideApplicationAcceleratorInDescription: {
      type: Boolean
    },
    isEdgeFunctionEnabled: {
      type: Boolean
    },
    clipboardWrite: {
      type: Function,
      required: true
    },
    isLoadBalancerEnabled: {
      type: Boolean,
      required: true
    }
  })

  const PHASE_OPTIONS = ['Request phase', 'Response phase']
  const PARSE_PHASE = {
    'Request phase': 'request',
    'Response phase': 'response'
  }
  const drawerRulesEngineRef = ref('')
  const hasContentToList = ref(true)
  const listRulesEngineRef = ref(null)
  const selectedPhase = ref('Request phase')

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'phase',
        header: 'Phase',
        type: 'component',
        filterPath: 'phase.content',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
        }
      },
      {
        field: 'status',
        header: 'Status',
        type: 'component',
        filterPath: 'status.content',
        sortField: 'status.content',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
        }
      },
      {
        field: 'description',
        header: 'Description'
      }
    ]
  })

  const handleTrackEditEvent = () => {
    tracker.product.clickToEdit({
      productName: 'Rules Engine'
    })
  }

  const handleCreateTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Rules Engine'
    })
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const listRulesEngineWithDecorator = async () => {
    return props.listRulesEngineService({
      id: props.edgeApplicationId,
      phase: PARSE_PHASE[selectedPhase.value]
    })
  }

  const deleteRulesEngineWithDecorator = async (ruleId, ruleData) => {
    const phase =
      ruleData.phase.content == 'Default' ? 'request' : ruleData.phase.content.toLowerCase()

    return await props.deleteRulesEngineService({
      edgeApplicationId: props.edgeApplicationId,
      ruleId,
      phase
    })
  }

  const reorderRulesEngineWithDecorator = async (tableData) => {
    return props.reorderRulesEngine(tableData, props.edgeApplicationId)
  }

  const reloadList = () => {
    listRulesEngineRef.value.reload()
  }

  const openCreateRulesEngineDrawerByPhase = () => {
    handleCreateTrackEvent()
    PARSE_PHASE[selectedPhase.value]
    drawerRulesEngineRef.value.openDrawerCreate(PARSE_PHASE[selectedPhase.value])
  }

  const openEditRulesEngineDrawer = (item) => {
    drawerRulesEngineRef.value.openDrawerEdit(item)
  }

  const titleEmptyState = computed(() => `No rule in the ${selectedPhase.value} has been created`)
  const descriptionEmptyState = computed(
    () => `Click the button below to create your first ${selectedPhase.value} rule.`
  )

  const removeReorderForRequestPhaseFirstItem = computed(
    () => selectedPhase.value === 'Response phase'
  )

  const actions = [
    {
      type: 'delete',
      title: 'rule',
      icon: 'pi pi-trash',
      service: deleteRulesEngineWithDecorator
    }
  ]
</script>

<template>
  <DrawerRulesEngine
    ref="drawerRulesEngineRef"
    :isApplicationAcceleratorEnabled="isApplicationAcceleratorEnabled"
    :isDeliveryProtocolHttps="isDeliveryProtocolHttps"
    :isImageOptimizationEnabled="isImageOptimizationEnabled"
    :listEdgeApplicationFunctionsService="listEdgeApplicationFunctionsService"
    :listOriginsService="listOriginsService"
    :clipboardWrite="clipboardWrite"
    :isLoadBalancerEnabled="isLoadBalancerEnabled"
    :listCacheSettingsService="listCacheSettingsService"
    :edgeApplicationId="edgeApplicationId"
    :createRulesEngineService="createRulesEngineService"
    :editRulesEngineService="editRulesEngineService"
    :loadRulesEngineService="loadRulesEngineService"
    :documentationService="documentationService"
    :hideApplicationAcceleratorInDescription="hideApplicationAcceleratorInDescription"
    :isEdgeFunctionEnabled="isEdgeFunctionEnabled"
    @onSuccess="reloadList"
    data-testid="rules-engine-drawer"
  />
  <ListTableBlock
    ref="listRulesEngineRef"
    :reorderableRows="true"
    :columns="getColumns"
    :onReorderService="reorderRulesEngineWithDecorator"
    :editInDrawer="openEditRulesEngineDrawer"
    :listService="listRulesEngineWithDecorator"
    @on-load-data="handleLoadData"
    :pt="{
      thead: { class: !hasContentToList && 'hidden' }
    }"
    emptyListMessage="No rules found."
    @on-before-go-to-edit="handleTrackEditEvent"
    :isReorderAllEnabled="removeReorderForRequestPhaseFirstItem"
    data-testid="rules-engine-list"
    :actions="actions"
    isTabs
  >
    <template #addButton>
      <div
        class="flex gap-4"
        data-testid="rules-engine-add-button"
      >
        <SelectButton
          v-model="selectedPhase"
          @change="reloadList"
          :options="PHASE_OPTIONS"
          :unselectable="true"
          data-testid="rules-engine-select-phase"
        />
        <PrimeButton
          icon="pi pi-plus"
          label="Rule"
          @click="openCreateRulesEngineDrawerByPhase"
          data-testid="rules-engine-create-button"
        />
      </div>
    </template>

    <template #noRecordsFound>
      <EmptyResultsBlock
        v-if="!hasContentToList"
        :title="titleEmptyState"
        :description="descriptionEmptyState"
        :createButtonLabel="selectedPhase"
        :documentationService="documentationService"
        :inTabs="true"
        :noBorder="true"
        data-testid="rules-engine-empty-results"
      >
        <template #default>
          <PrimeButton
            class="max-md:w-full w-fit"
            @click="openCreateRulesEngineDrawerByPhase"
            severity="secondary"
            icon="pi pi-plus"
            label="Rule"
            data-testid="rules-engine-empty-results-create-button"
          />
        </template>
      </EmptyResultsBlock>
    </template>
  </ListTableBlock>
</template>
