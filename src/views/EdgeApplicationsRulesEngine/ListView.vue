<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import DrawerRulesEngine from '@/views/EdgeApplicationsRulesEngine/Drawer'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'

  import PrimeButton from 'primevue/button'
  import SelectButton from 'primevue/selectbutton'
  import { computed, ref, inject } from 'vue'
  import { useToast } from 'primevue/usetoast'

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

  const RULES_ENGINE_API_FIELDS = [
    'id',
    'name',
    'description',
    'phase',
    'behaviors',
    'criteria',
    'active',
    'order'
  ]

  const PHASE_OPTIONS = ['Request phase', 'Response phase']
  const PARSE_PHASE = {
    'Request phase': 'request',
    'Response phase': 'response'
  }
  const drawerRulesEngineRef = ref('')
  const hasContentToList = ref(true)
  const listRulesEngineRef = ref(null)
  const selectedPhase = ref('Request phase')
  const toast = useToast()

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name',
        disableSort: true
      },
      {
        field: 'phase',
        header: 'Phase',
        type: 'component',
        filterPath: 'phase',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
        },
        disableSort: true
      },
      {
        field: 'status',
        header: 'Status',
        type: 'component',
        filterPath: 'active',
        sortField: 'active',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
        },
        disableSort: true
      },
      {
        field: 'description',
        header: 'Description',
        disableSort: true
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

  const listRulesEngineWithDecorator = async (query) => {
    return props.listRulesEngineService({
      id: props.edgeApplicationId,
      phase: PARSE_PHASE[selectedPhase.value],
      ...query
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

  /**
   * Moves an item within the original array based on updated positions in a reference array.
   *
   * @param {Array} originalArray - The array to be modified.
   * @param {Array} referenceArray - The reference array with the new order.
   * @param {number} fromIndex - The index of the item to move in the reference array.
   * @param {number} toIndex - The target index  in the reference array.
   * @returns {Array} The updated array with the item moved.
   */
  const moveItem = (originalArray, referenceArray, fromIndex, toIndex) => {
    const oldItemMove = toIndex + Math.sign(fromIndex - toIndex)
    const itemToMoveId = referenceArray[toIndex]
    const targetItemId = referenceArray[oldItemMove]

    const originalItemIndex = originalArray.findIndex((item) => item.id === itemToMoveId.id)
    const targetItemIndex = originalArray.findIndex((item) => item.id === targetItemId.id)

    const [itemToMove] = originalArray.splice(originalItemIndex, 1)
    originalArray.splice(targetItemIndex, 0, itemToMove)

    return originalArray
  }

  const checkOrderRules = async ({ event, data }) => {
    const tableTypeRequest = PARSE_PHASE[selectedPhase.value] === 'request'
    const { dragIndex: originIndex, dropIndex: destinationIndex, value: updatedTable } = event
    const alterFirstItem = originIndex === 0 || destinationIndex === 0

    if (tableTypeRequest && alterFirstItem) {
      const firstItem = updatedTable[originIndex]
      const secondItem = updatedTable[destinationIndex]
      const isDefaultRuleMoved =
        firstItem.name === 'Default Rule' || secondItem.name === 'Default Rule'
      if (isDefaultRuleMoved) {
        toast.add({
          closable: true,
          severity: 'error',
          summary: 'The default rule cannot be reordered'
        })
        return
      }
    }

    const reorderedData = moveItem(data.value, updatedTable, originIndex, destinationIndex)

    data.value = reorderedData

    // import { getArrayChangedIndexes } from '@/helpers/get-array-changed-indexes'

    // try {
    //   const tableData = getArrayChangedIndexes(data.value, event.dragIndex, event.dropIndex)
    //   await props.onReorderService(tableData, data.value, savedOrdering.value, savedSearch.value)
    //   data.value = tableData
    //   reload()
    //   toast.add({
    //     closable: true,
    //     severity: 'success',
    //     summary: 'Reorder saved'
    //   })
    // } catch (error) {
    //   toast.add({
    //     closable: true,
    //     severity: 'error',
    //     summary: error
    //   })
    // }
  }

  const updateRulesOrder = async ({ data, reload }) => {
    //   toast.add({
    //     closable: true,
    //     severity: 'success',
    //     summary: 'Reorder saved'
    //   })
  }
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
  <FetchListTableBlock
    :lazy="false"
    ref="listRulesEngineRef"
    :reorderableRows="true"
    :columns="getColumns"
    :editInDrawer="openEditRulesEngineDrawer"
    :listService="listRulesEngineWithDecorator"
    @on-load-data="handleLoadData"
    :pt="{
      thead: { class: !hasContentToList && 'hidden' }
    }"
    emptyListMessage="No rules found."
    @on-before-go-to-edit="handleTrackEditEvent"
    @onReorder="checkOrderRules"
    :isReorderAllEnabled="removeReorderForRequestPhaseFirstItem"
    data-testid="rules-engine-list"
    :actions="actions"
    isTabs
    :apiFields="RULES_ENGINE_API_FIELDS"
    :defaultOrderingFieldName="''"
    :rowsPerPageOptions="[2000]"
  >
    <template #addButton="{ reload, data }">
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
        <PrimeButton
          icon="pi pi-save"
          disabled
          label="Save order"
          data-testid="rules-engine-save-order-button"
          @click="updateRulesOrder({ data, reload })"
          v-tooltip.bottom="{ value: 'Saves the new order of rules.', showDelay: 200 }"
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
  </FetchListTableBlock>
</template>
