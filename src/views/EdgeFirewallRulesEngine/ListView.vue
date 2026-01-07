<script setup>
  import PrimeButton from 'primevue/button'
  import FetchListTableBlock from '@/templates/list-table-block/v2/index.vue'
  import Drawer from './Drawer'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { computed, ref, inject } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import { useDialog } from 'primevue/usedialog'
  import orderDialog from '@/views/EdgeApplicationsRulesEngine/Dialog/order-dialog.vue'

  import { networkListsService } from '@/services/v2/network-lists/network-lists-service'
  import { edgeFirewallRulesEngineService } from '@/services/v2/edge-firewall/edge-firewall-rules-engine-service'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({
    name: 'edge-firewall-rules-engine-list-view'
  })

  const props = defineProps({
    documentationService: {
      type: Function,
      required: true
    },
    createEdgeFirewallRulesEngineService: {
      type: Function,
      required: true
    },
    editEdgeFirewallRulesEngineService: {
      type: Function,
      required: true
    },

    loadEdgeFirewallRulesEngineService: {
      type: Function,
      required: true
    },
    listFunctionsService: {
      type: Function,
      required: true
    },
    edgeFirewallId: {
      type: String || Number,
      required: true
    },
    reorderRulesEngine: {
      type: Function,
      required: true
    }
  })
  const hasContentToList = ref(true)
  const drawerRef = ref('')
  const listTableBlockRef = ref('')
  const toast = useToast()
  const dialog = useDialog()

  const EDGE_FIREWALL_RULES_ENGINE_API_FIELDS = [
    'id',
    'name',
    'description',
    'last_modified',
    'last_editor',
    'active'
  ]

  const listEdgeFirewallRulesEngineServiceWithDecorator = async (query) => {
    return await edgeFirewallRulesEngineService.listEdgeFirewallRulesEngineService({
      id: props.edgeFirewallId,
      ...query
    })
  }
  const deleteEdgeFirewallRulesEngineServiceWithDecorator = async (ruleEngineId) => {
    return await edgeFirewallRulesEngineService.deleteEdgeFirewallRulesEngineService(
      props.edgeFirewallId,
      ruleEngineId
    )
  }

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

  const openCreateDrawer = () => {
    handleCreateTrackEvent()
    drawerRef.value.openCreateDrawer()
  }

  const openEditDrawer = (item) => {
    drawerRef.value.openEditDrawer(item.id)
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const reorderDecoratorService = async (data, reload) => {
    isLoadingButtonOrder.value = true
    try {
      await edgeFirewallRulesEngineService.reorderEdgeFirewallRulesEngineService(
        data,
        props.edgeFirewallId
      )
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Success',
        detail: 'Reorder saved'
      })
    } catch (error) {
      if (error && typeof error.showErrors === 'function') {
        error.showErrors(toast)
      } else {
        toast.add({
          closable: true,
          severity: 'error',
          summary: 'Error',
          detail: error
        })
      }
    } finally {
      isLoadingButtonOrder.value = false
      reload()
    }
  }

  const getColumns = computed(() => [
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
      field: 'description',
      header: 'Description',
      filterPath: 'description.value',
      type: 'component',
      class: 'max-w-[250px]',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'text-format-with-popup' }),
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
    },
    {
      field: 'status',
      header: 'Status',
      sortField: 'status.content',
      filterPath: 'status.content',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      },
      disableSort: true
    }
  ])

  const actions = [
    {
      label: 'Delete',
      type: 'delete',
      title: 'rule',
      icon: 'pi pi-trash',
      service: deleteEdgeFirewallRulesEngineServiceWithDecorator
    }
  ]

  const isLoadingButtonOrder = ref(false)
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

  const openCreateRulesEngineDrawerByPhase = () => {
    handleCreateTrackEvent()
    drawerRef.value.openCreateDrawer()
  }

  defineExpose({
    openCreateDrawer: openCreateRulesEngineDrawerByPhase
  })
</script>
<template>
  <Drawer
    ref="drawerRef"
    :edgeFirewallId="edgeFirewallId"
    :createService="createEdgeFirewallRulesEngineService"
    :listFunctionsService="listFunctionsService"
    :loadService="loadEdgeFirewallRulesEngineService"
    :editService="editEdgeFirewallRulesEngineService"
    :listNetworkListService="networkListsService.listNetworkLists"
    :loadNetworkListService="networkListsService.loadNetworkList"
    @onSuccess="listTableBlockRef.reload()"
  />

  <FetchListTableBlock
    ref="listTableBlockRef"
    orderableRows
    isTabs
    :columns="getColumns"
    :editInDrawer="openEditDrawer"
    :listService="listEdgeFirewallRulesEngineServiceWithDecorator"
    :pt="{
      thead: { class: !hasContentToList && 'hidden' }
    }"
    emptyListMessage="No rules found."
    data-testid="rules-engine-list"
    :actions="actions"
    :apiFields="EDGE_FIREWALL_RULES_ENGINE_API_FIELDS"
    :emptyBlock="{
      title: 'No rule has been created',
      description: 'Click the button below to create your first rule.',
      createButtonLabel: 'Rule',
      documentationService: documentationService
    }"
    @on-before-go-to-edit="handleTrackEditEvent"
    @on-load-data="handleLoadData"
    @on-review-changes="
      ({ data, alteredRows, reload }) => updateRulesOrder(data, alteredRows, reload)
    "
  >
    <template #emptyBlockButton>
      <PrimeButton
        icon="pi pi-plus"
        severity="secondary"
        label="Rule"
        @click="openCreateDrawer"
        data-testid="create_Rules Engine_button"
      />
    </template>
  </FetchListTableBlock>
</template>
