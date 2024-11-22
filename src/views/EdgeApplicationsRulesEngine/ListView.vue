<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import DrawerRulesEngine from '@/views/EdgeApplicationsRulesEngine/Drawer'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'

  import PrimeButton from 'primevue/button'
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

  const PARSE_PHASE = {
    'Request phase': 'request',
    'Response phase': 'response'
  }
  const disabledOrdering = ref(true)
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
    drawerRulesEngineRef.value.openDrawerCreate(PARSE_PHASE[selectedPhase.value])
  }

  const openEditRulesEngineDrawer = (item) => {
    drawerRulesEngineRef.value.openDrawerEdit(item)
  }

  const titleEmptyState = computed(() => `No rule in the ${selectedPhase.value} has been created`)
  const descriptionEmptyState = computed(
    () => `Click the button below to create your first ${selectedPhase.value} rule.`
  )

  const actions = [
    {
      type: 'delete',
      title: 'rule',
      icon: 'pi pi-trash',
      service: deleteRulesEngineWithDecorator
    }
  ]

  const checkOrderRules = async ({ event, data, moveItem }) => {
    if (isLoadingButtonOrder.value) {
      toast.add({
        closable: true,
        severity: 'info',
        summary: 'info',
        detail: 'Please wait until the current operation is completed'
      })
      return
    }

    const { dragIndex: originIndex, dropIndex: destinationIndex, value: updatedTable } = event

    const reorderedData = moveItem(data.value, updatedTable, originIndex, destinationIndex)

    const isFirstRuleNotDefault = reorderedData[0].name !== 'Default Rule'

    if (isFirstRuleNotDefault) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'The default rule cannot be reordered'
      })
      return
    }

    data.value = reorderedData
    disabledOrdering.value = false
  }

  const isLoadingButtonOrder = ref(false)

  const updateRulesOrder = async (data, reload) => {
    disabledOrdering.value = true
    try {
      isLoadingButtonOrder.value = true
      await props.reorderRulesEngine(data, props.edgeApplicationId)
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'success',
        detail: 'Reorder saved'
      })
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'error',
        detail: error
      })
    } finally {
      await reload()
      isLoadingButtonOrder.value = false
    }
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
        <PrimeButton
          icon="pi pi-plus"
          label="Rule"
          @click="openCreateRulesEngineDrawerByPhase"
          data-testid="rules-engine-create-button"
        />
        <teleport to="#action-bar">
          <div
            class="flex w-full gap-4 justify-end h-14 items-center border-t surface-border sticky bottom-0 surface-section z-50 px-2 md:px-8"
          >
            <PrimeButton
              outlined
              icon="pi pi-save"
              class="bg-primary"
              :disabled="disabledOrdering"
              :pt="{
                label: { class: 'text-[var(--surface-section)]' },
                icon: { class: 'text-[var(--surface-section)]' },
                loadingIcon: { class: 'text-[var(--surface-section)]' }
              }"
              label="Save order"
              :loading="isLoadingButtonOrder"
              data-testid="rules-engine-save-order-button"
              @click="updateRulesOrder(data, reload)"
              v-tooltip.bottom="{ value: 'Saves the new order of rules.', showDelay: 200 }"
            />
          </div>
        </teleport>
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
