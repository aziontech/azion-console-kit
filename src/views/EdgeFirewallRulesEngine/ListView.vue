<script setup>
  import EmptyResultsBlock from '@templates/empty-results-block'
  import PrimeButton from 'primevue/button'
  import FetchListTableBlock from '@/templates/list-table-block/v2/index.vue'
  import Drawer from './Drawer'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { computed, ref, inject } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import { useDialog } from 'primevue/usedialog'
  import { storeToRefs } from 'pinia'
  import { useAccountStore } from '@/stores/account'
  import orderDialog from '@/views/EdgeApplicationsRulesEngine/Dialog/order-dialog.vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const { currentTheme } = storeToRefs(useAccountStore())

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
    listEdgeFirewallRulesEngineService: {
      type: Function,
      required: true
    },
    deleteEdgeFirewallRulesEngineService: {
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
    listWafRulesService: {
      type: Function,
      required: true
    },
    edgeFirewallId: {
      type: String || Number,
      required: true
    },
    edgeFirewallModules: {
      type: Object,
      required: true
    },
    listNetworkListService: {
      type: Function,
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
  const selectedPhase = ref('Request phase')
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

  const PARSE_PHASE = {
    'Request phase': 'request',
    'Response phase': 'response'
  }

  const listEdgeFirewallRulesEngineServiceWithDecorator = async (query) => {
    return await props.listEdgeFirewallRulesEngineService({
      id: props.edgeFirewallId,
      ...query
    })
  }
  const deleteEdgeFirewallRulesEngineServiceWithDecorator = async (ruleEngineId) => {
    return await props.deleteEdgeFirewallRulesEngineService({
      edgeFirewallId: props.edgeFirewallId,
      ruleEngineId
    })
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

  const reloadList = () => {
    if (hasContentToList.value) {
      listTableBlockRef.value.reload()
      return
    }
    hasContentToList.value = true
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
      await props.reorderRulesEngine(data, props.edgeFirewallId)
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

  const getColumns = computed(() => [
    {
      field: 'name',
      header: 'Name',
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
    },
    {
      field: 'description',
      header: 'Description',
      filterPath: 'description.value',
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'expand-text-column' }),
      disableSort: true
    },
    {
      field: 'lastModified',
      header: 'Last Modified',
      disableSort: true
    },
    {
      field: 'lastEditor',
      header: 'Last Editor',
      disableSort: true
    }
  ])

  const actions = [
    {
      type: 'delete',
      title: 'rule',
      icon: 'pi pi-trash',
      service: deleteEdgeFirewallRulesEngineServiceWithDecorator
    }
  ]

  const disabledOrdering = ref(true)

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
    drawerRef.value.openDrawerCreate(PARSE_PHASE[selectedPhase.value])
  }

  const badgeClass = computed(() => {
    if (currentTheme.value !== 'dark') {
      return 'p-badge-lg !text-black bg-white !border-surface h-5 min-w-[20px] !text-xl'
    } else {
      return 'p-badge-lg !text-white bg-black !border-surface h-5 min-w-[20px] !text-xl'
    }
  })
</script>
<template>
  <Drawer
    ref="drawerRef"
    :edgeFirewallId="edgeFirewallId"
    :edgeFirewallModules="edgeFirewallModules"
    :createService="createEdgeFirewallRulesEngineService"
    :listFunctionsService="listFunctionsService"
    :listWafRulesService="listWafRulesService"
    :loadService="loadEdgeFirewallRulesEngineService"
    :editService="editEdgeFirewallRulesEngineService"
    :listNetworkListService="listNetworkListService"
    @onSuccess="reloadList"
  />

  <FetchListTableBlock
    v-if="hasContentToList"
    ref="listTableBlockRef"
    orderableRows
    :columns="getColumns"
    :editInDrawer="openEditDrawer"
    :listService="listEdgeFirewallRulesEngineServiceWithDecorator"
    @on-load-data="handleLoadData"
    :pt="{
      thead: { class: !hasContentToList && 'hidden' }
    }"
    emptyListMessage="No rules found."
    @on-before-go-to-edit="handleTrackEditEvent"
    data-testid="rules-engine-list"
    :actions="actions"
    isTabs
    :apiFields="EDGE_FIREWALL_RULES_ENGINE_API_FIELDS"
    :defaultOrderingFieldName="''"
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
  </FetchListTableBlock>
  <EmptyResultsBlock
    v-else
    title="No rule has been created"
    description="Click the button below to create your first rule."
    createButtonLabel="Rule"
    :documentationService="documentationService"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        class="max-md:w-full w-fit"
        severity="secondary"
        icon="pi pi-plus"
        label="Rules Engine"
        data-testid="create_Rules Engine_button"
        @click="openCreateDrawer"
      />
      <PrimeButton
        icon="pi pi-save"
        :disabled="disabledOrdering"
        label="Save order"
        :loading="isLoadingButtonOrder"
        data-testid="rules-engine-save-order-button"
        @click="updateRulesOrder(data, reload)"
        v-tooltip.bottom="{ value: 'Saves the new order of rules.', showDelay: 200 }"
      />
    </template>
  </EmptyResultsBlock>
</template>
