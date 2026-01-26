<script setup>
  import { computed, ref, inject } from 'vue'
  import { rulesEngineService } from '@/services/v2/edge-app/edge-app-rules-engine-service'
  import { useDialog } from 'primevue/usedialog'
  import { useToast } from 'primevue/usetoast'
  import PrimeButton from 'primevue/button'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import DrawerRulesEngine from '@/views/EdgeApplicationsRulesEngine/Drawer'
  import TableBlock from '@/templates/list-table-block/v2/index.vue'
  import orderDialog from '@/views/EdgeApplicationsRulesEngine/Dialog/order-dialog.vue'
  import { COLUMN_STYLES, columnStyles } from '@/helpers/column-styles'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

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
  const listRulesEngineRef = ref(null)
  const selectedPhase = ref('Request phase')
  const dialog = useDialog()
  const toast = useToast()
  const currentPhase = ref('request')
  const hasContentToList = ref(true)
  const isLoadingButtonOrder = ref(false)

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
        filterPath: 'id',
        style: COLUMN_STYLES.FIT_CONTENT
      },
      {
        field: 'name',
        header: 'Name',
        disableSort: true,
        style: columnStyles.priority(1, 150),
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-format-with-popup'
          })
        }
      },
      {
        field: 'status',
        header: 'Status',
        type: 'component',
        filterPath: 'active',
        sortField: 'active',
        style: COLUMN_STYLES.FIT_CONTENT,
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
        disableSort: true,
        type: 'component',
        style: columnStyles.priority(5, 350, 400),
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-format-with-popup'
          })
        }
      },
      {
        field: 'lastEditor',
        header: 'Last Editor',
        disableSort: true,
        style: COLUMN_STYLES.FIT_CONTENT
      },
      {
        field: 'lastModified',
        header: 'Last Modified',
        disableSort: true,
        style: COLUMN_STYLES.FIT_CONTENT,
        dynamicClass: (columnData) => (columnData === 'Not Available' ? 'text-color-secondary' : '')
      }
    ]
  })

  const actions = computed(() => [
    {
      label: 'Delete',
      type: 'delete',
      title: 'rule',
      icon: 'pi pi-trash',
      service: deleteRulesEngineWithDecorator
    }
  ])

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

  const listRulesEngineWithDecorator = async (params) => {
    return await rulesEngineService.listRulesEngineRequestAndResponsePhase({
      edgeApplicationId: props.edgeApplicationId,
      params
    })
  }

  const deleteRulesEngineWithDecorator = async (ruleId, ruleData) => {
    const phase = ruleData.phase?.content.toLowerCase()

    return await rulesEngineService.deleteRulesEngine({
      edgeApplicationId: props.edgeApplicationId,
      ruleId,
      phase
    })
  }

  const openCreateRulesEngineDrawerByPhase = () => {
    handleCreateTrackEvent()
    drawerRulesEngineRef.value.openDrawerCreate(PARSE_PHASE[selectedPhase.value])
  }

  const openEditRulesEngineDrawer = (item) => {
    currentPhase.value = item.phase.content.toLowerCase()
    drawerRulesEngineRef.value.openDrawerEdit(item)
  }

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

  const handleNavigateToMainSettings = () => {
    props.navigateToApplicationAccelerator()
  }
  const handleLoadData = (event) => {
    hasContentToList.value = event
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
    @onSuccess="listRulesEngineRef.reload()"
    data-testid="rules-engine-drawer"
    @navigate-to-main-settings="handleNavigateToMainSettings"
  />

  <TableBlock
    ref="listRulesEngineRef"
    orderableRows
    isTabs
    expandableRowGroups
    isEdgeApplicationRulesEngine
    :columns="getColumns"
    :editInDrawer="openEditRulesEngineDrawer"
    :listService="listRulesEngineWithDecorator"
    emptyListMessage="No rules found."
    data-testid="rules-engine-list"
    :actions="actions"
    :apiFields="RULES_ENGINE_API_FIELDS"
    groupColumn="phase.content"
    exportFileName="Application Rules Engine"
    :expandedRowGroups="['Default', 'Request', 'Response']"
    :empty-block="{
      title: 'No rules engine have been created',
      description: 'Click the button below to create your first rules engine.',
      documentationService: documentationService
    }"
    :pt="{
      thead: { class: !hasContentToList && 'hidden' }
    }"
    @on-review-changes="
      ({ data, alteredRows, reload }) => updateRulesOrder(data, alteredRows, reload)
    "
    @on-load-data="handleLoadData"
    @on-before-go-to-edit="handleTrackEditEvent"
  >
    <template #emptyBlockButton>
      <PrimeButton
        icon="pi pi-plus"
        severity="secondary"
        label="Rule"
        @click="openCreateRulesEngineDrawerByPhase"
        data-testid="rules-engine-create-button"
      />
    </template>
  </TableBlock>
</template>
