<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import DrawerRulesEngine from '@/views/EdgeApplicationsRulesEngine/Drawer'
  import TableBlock from '@/templates/list-table-block/v2/index.vue'
  import { useDialog } from 'primevue/usedialog'
  import { useToast } from 'primevue/usetoast'
  import PrimeButton from 'primevue/button'
  import { computed, ref, inject } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useAccountStore } from '@/stores/account'
  import orderDialog from '@/views/EdgeApplicationsRulesEngine/Dialog/order-dialog.vue'
  import { rulesEngineService } from '@/services/v2/edge-app/edge-app-rules-engine-service'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const { currentTheme } = storeToRefs(useAccountStore())

  defineOptions({ name: 'list-edge-applications-device-groups-tab' })

  const props = defineProps({
    edgeApplicationId: {
      required: true,
      type: String
    },
    documentationService: {
      required: true,
      type: Function
    },
    isApplicationAcceleratorEnabled: {
      required: true,
      type: Boolean
    },
    isImageOptimizationEnabled: {
      required: true,
      type: Boolean
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
    navigateToApplicationAccelerator: {
      type: Function,
      required: false
    }
  })

  const RULES_ENGINE_API_FIELDS = [
    'id',
    'name',
    'description',
    'phase',
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
  const currentPhase = ref('request')

  const getColumns = computed(() => {
    return [
      {
        field: 'phase.content',
        header: 'phase',
        disableSort: true,
        hidden: true
      },
      {
        field: 'id',
        header: 'ID',
        sortField: 'id',
        filterPath: 'id'
      },
      {
        field: 'name',
        header: 'Name',
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
      },
      {
        field: 'lastEditor',
        header: 'Last Editor',
        disableSort: true
      },
      {
        field: 'lastModified',
        header: 'Last Modified',
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

  const listRulesEngineWithDecorator = async (params) => {
    const data = await rulesEngineService.listRulesEngineRequestAndResponsePhase({
      edgeApplicationId: props.edgeApplicationId,
      params
    })
    return data
  }

  const deleteRulesEngineWithDecorator = async (ruleId, ruleData) => {
    const phase = ruleData.phase?.content.toLowerCase()

    return await rulesEngineService.deleteRulesEngine({
      edgeApplicationId: props.edgeApplicationId,
      ruleId,
      phase
    })
  }

  const reloadList = () => {
    if (hasContentToList.value) {
      listRulesEngineRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  const openCreateRulesEngineDrawerByPhase = () => {
    handleCreateTrackEvent()
    drawerRulesEngineRef.value.openDrawerCreate(PARSE_PHASE[selectedPhase.value])
  }

  const openEditRulesEngineDrawer = (item) => {
    currentPhase.value = item.phase.content.toLowerCase()
    drawerRulesEngineRef.value.openDrawerEdit(item)
  }

  const actions = [
    {
      label: 'Delete',
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
      await rulesEngineService.reorderRulesEngine(data, props.edgeApplicationId)
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Success',
        detail: 'Reorder saved'
      })
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
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
        rules: alteredRows,
        isEdgeApplicationRulesEngine: true
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

  const badgeClass = computed(() => {
    if (currentTheme.value !== 'dark') {
      return 'p-badge-lg !text-black bg-white !border-surface h-5 min-w-[20px] !text-xl'
    } else {
      return 'p-badge-lg !text-white bg-black !border-surface h-5 min-w-[20px] !text-xl'
    }
  })

  const handleNavigateToMainSettings = () => {
    props.navigateToApplicationAccelerator()
  }

  defineExpose({
    openCreateDrawer: openCreateRulesEngineDrawerByPhase
  })
</script>

<template>
  <DrawerRulesEngine
    ref="drawerRulesEngineRef"
    :isApplicationAcceleratorEnabled="isApplicationAcceleratorEnabled"
    :isImageOptimizationEnabled="isImageOptimizationEnabled"
    :listOriginsService="listOriginsService"
    :clipboardWrite="clipboardWrite"
    :edgeApplicationId="edgeApplicationId"
    :documentationService="documentationService"
    :hideApplicationAcceleratorInDescription="hideApplicationAcceleratorInDescription"
    :isEdgeFunctionEnabled="isEdgeFunctionEnabled"
    :currentPhase="currentPhase"
    @onSuccess="reloadList"
    data-testid="rules-engine-drawer"
    @navigate-to-main-settings="handleNavigateToMainSettings"
  />

  <TableBlock
    ref="listRulesEngineRef"
    orderableRows
    v-if="hasContentToList"
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
    :expandedRowGroups="['Default', 'Request', 'Response']"
    expandableRowGroups
    isEdgeApplicationRulesEngine
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
              outlined
              label="Discard Changes"
              @click="reload"
              data-testid="review-changes-dialog-footer-cancel-button"
            />
            <PrimeButton
              label="Review Changes"
              class="bg-surface"
              :badgeClass="badgeClass"
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
  </TableBlock>

  <EmptyResultsBlock
    v-else
    title="No rules engine have been created"
    description="Click the button below to create your first rules engine."
    createButtonLabel="Create Rules Engine"
    :documentationService="documentationService"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        class="max-md:w-full w-fit"
        severity="secondary"
        icon="pi pi-plus"
        label="Rule"
        @click="openCreateRulesEngineDrawerByPhase"
        data-testid="edge-application-rules-engine-list__create-rules-engine__button"
      />
    </template>
  </EmptyResultsBlock>
</template>
