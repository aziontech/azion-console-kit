<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import DrawerRulesEngine from '@/views/EdgeApplicationsRulesEngine/Drawer'
  import TableBlock from '@/templates/list-table-block/v2/index.vue'
  import { useDialog } from 'primevue/usedialog'
  import { useToast } from 'primevue/usetoast'
  import PrimeButton from 'primevue/button'
  import { computed, ref, inject } from 'vue'
  import orderDialog from '@/views/EdgeApplicationsRulesEngine/Dialog/order-dialog.vue'

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
    'order',
    'last_modified',
    'last_editor'
  ]

  const PARSE_PHASE = {
    'Request phase': 'request',
    'Response phase': 'response'
  }

  const drawerRulesEngineRef = ref('')
  const hasContentToList = ref(true)
  const listRulesEngineRef = ref(null)
  const selectedPhase = ref('Request phase')
  const dialog = useDialog()
  const toast = useToast()

  const getColumns = computed(() => {
    return [
      {
        field: 'phase.content',
        header: 'phase',
        disableSort: true,
        hidden: true
      },
      {
        field: 'name',
        header: 'Name',
        disableSort: true
      },
      {
        field: 'description',
        header: 'Description',
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
    const data = await props.listRulesEngineService({
      id: props.edgeApplicationId,
      ...query
    })
    return data
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

  const isLoadingButtonOrder = ref(false)

  const reorderDecoratorService = async (data, reload) => {
    isLoadingButtonOrder.value = true
    try {
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
      isLoadingButtonOrder.value = false
      reload()
    }
  }

  const updateRulesOrder = async (rows, alteredRows, reload) => {
    dialog.open(orderDialog, {
      data: {
        rules: alteredRows
      },
      onClose: ({ data }) => {
        if (data?.updated || data?.reset) {
          return reload()
        }
        if (data?.save) {
          return reorderDecoratorService(rows, reload)
        }
      }
    })
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
  <TableBlock
    ref="listRulesEngineRef"
    :orderableRows="true"
    :columns="getColumns"
    :editInDrawer="openEditRulesEngineDrawer"
    :listService="listRulesEngineWithDecorator"
    @on-load-data="handleLoadData"
    :pt="{
      thead: { class: !hasContentToList && 'hidden' }
    }"
    emptyListMessage="No rules found."
    @on-before-go-to-edit="handleTrackEditEvent"
    data-testid="rules-engine-list"
    :actions="actions"
    isTabs
    :apiFields="RULES_ENGINE_API_FIELDS"
    :defaultOrderingFieldName="''"
    groupColumn="phase.content"
    :expandedRowGroups="['Request', 'Response']"
  >
    <template #addButton="{ reload, data, columnOrderAltered, alteredRows }">
      <div
        class="flex gap-4"
        data-testid="rules-engine-add-button"
      >
        <PrimeButton
          icon="pi pi-plus"
          label="Rule"
          :disabled="columnOrderAltered"
          @click="openCreateRulesEngineDrawerByPhase"
          data-testid="rules-engine-create-button"
        />
        <teleport
          to="#action-bar"
          v-if="columnOrderAltered"
        >
          <div
            class="flex w-full gap-4 justify-end h-14 items-center border-t surface-border sticky bottom-0 surface-section px-2 md:px-8"
          >
            <PrimeButton
              class="bg-secondary"
              outlined
              label="Cancel"
              @click="reload"
              :disabled="isLoadingButtonOrder"
              data-testid="rules-engine-cancel-order-button"
            />

            <PrimeButton
              label="Review Changes"
              badgeClass="p-badge-lg text-color bg-transparent h-5 min-w-[20px] !text-xl"
              :loading="isLoadingButtonOrder"
              :disabled="isLoadingButtonOrder"
              data-testid="rules-engine-save-order-button"
              size="small"
              type="button"
              @click="updateRulesOrder(data, alteredRows, reload)"
              :badge="alteredRows.length"
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
  </TableBlock>
</template>
