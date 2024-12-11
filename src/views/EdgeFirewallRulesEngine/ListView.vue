<script setup>
  import EmptyResultsBlock from '@templates/empty-results-block'
  import PrimeButton from 'primevue/button'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import Drawer from './Drawer'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { computed, ref, inject } from 'vue'
  import { useToast } from 'primevue/usetoast'

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
  const toast = useToast()

  const EDGE_FIREWALL_RULES_ENGINE_API_FIELDS = [
    'id',
    'name',
    'description',
    'last_modified',
    'last_editor',
    'is_active'
  ]

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

  const checkOrderRules = async ({ event, data, moveItem }) => {
    if (isLoadingButtonOrder.value) {
      toast.add({
        closable: true,
        severity: 'info',
        summary: 'info',
        detail: 'Please wait until the current operation is completed.'
      })
      return
    }
    const { dragIndex: originIndex, dropIndex: destinationIndex, value: updatedTable } = event
    const reorderedData = moveItem(data.value, updatedTable, originIndex, destinationIndex)

    data.value = reorderedData
    disabledOrdering.value = false
  }

  const isLoadingButtonOrder = ref(false)
  const updateRulesOrder = async (data, reload) => {
    disabledOrdering.value = true
    try {
      isLoadingButtonOrder.value = true
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
      await reload()
      isLoadingButtonOrder.value = false
    }
  }
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
    :lazy="false"
    ref="listTableBlockRef"
    :reorderableRows="true"
    :listService="listEdgeFirewallRulesEngineServiceWithDecorator"
    :columns="getColumns"
    :editInDrawer="openEditDrawer"
    @on-load-data="handleLoadData"
    @on-before-go-to-edit="handleTrackEditEvent"
    emptyListMessage="No rules found."
    addButtonLabel="Rules Engine"
    :pt="{
      thead: { class: !hasContentToList && 'hidden' }
    }"
    :actions="actions"
    @onReorder="checkOrderRules"
    isTabs
    :apiFields="EDGE_FIREWALL_RULES_ENGINE_API_FIELDS"
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
          @click="openCreateDrawer"
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
