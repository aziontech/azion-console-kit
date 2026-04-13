<script setup>
  import { computed, ref, inject, onMounted } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import PrimeTag from '@aziontech/webkit/tag'
  import InputNumber from '@aziontech/webkit/inputnumber'
  import Skeleton from '@aziontech/webkit/skeleton'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { useDialog } from '@aziontech/webkit/use-dialog'
  import { storeToRefs } from 'pinia'
  import { useThemeStore } from '@/stores/theme'
  import Drawer from '@/views/EdgeFirewallRulesEngine/Drawer'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import orderDialog from '@/views/EdgeApplicationsRulesEngine/Dialog/order-dialog.vue'
  // TODO: migrate import to @aziontech/webkit/list-data-table when published
  import DataTable from '@aziontech/webkit/list-data-table'
  import { useDataTable } from '@/composables/useDataTable'

  import { networkListsService } from '@/services/v2/network-lists/network-lists-service'
  import { edgeFirewallRulesEngineService } from '@/services/v2/edge-firewall/edge-firewall-rules-engine-service'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const toast = useToast()
  const dialog = useDialog()
  const { currentTheme } = storeToRefs(useThemeStore())

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
  const isLoadingButtonOrder = ref(false)

  const emit = defineEmits([
    'on-load-data',
    'on-reorder',
    'on-before-go-to-add-page',
    'on-before-go-to-edit',
    'update:selectedItensData',
    'on-review-changes'
  ])

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

  const actions = computed(() => [
    {
      label: 'Delete',
      type: 'delete',
      title: 'rule',
      icon: 'pi pi-trash',
      service: deleteEdgeFirewallRulesEngineServiceWithDecorator
    }
  ])

  // --- useDataTable integration ---
  const tableProps = {
    columns: getColumns,
    listService: listEdgeFirewallRulesEngineServiceWithDecorator,
    actions,
    emptyListMessage: 'No rules found.',
    exportFileName: 'Firewall Rules Engine',
    editInDrawer: openEditDrawer,
    isTabs: true,
    orderableRows: true,
    showContrastInactiveLine: false,
    enableEditClick: true
  }

  const {
    isLoading,
    data,
    selectedColumns,
    filters,
    selectedItems,
    isRenderActions,
    filterBy,
    reload,
    editItemSelected,
    actionOptions,
    executeCommand,
    toggleActionsMenu,
    setMenuRefForRow,
    extractFieldValue,
    handleExportTableDataToCSV
  } = useDataTable(tableProps, emit)

  // --- Position ordering logic (from v2/index.vue, non-EA mode) ---
  const valueInputedUser = ref(0)
  const optionsColumns = ref([])

  const columnOrderAltered = computed(() => {
    return data.value.some((row) => row.position?.altered)
  })

  const alteredRows = computed(() => {
    return data.value.filter((row) => row.position?.altered)
  })

  const badgeClass = computed(() => {
    if (currentTheme.value !== 'dark') {
      return 'p-badge-lg !text-black bg-white !border-surface h-5 min-w-[20px] !text-xl'
    } else {
      return 'p-badge-lg !text-white bg-black !border-surface h-5 min-w-[20px] !text-xl'
    }
  })

  const discardChanges = () => {
    data.value.forEach((row) => {
      if (row.position && row.position.altered) {
        row.position.value = row.position.immutableValue
        row.position.altered = false
      }
    })

    data.value.sort((val_a, val_b) => {
      if (!val_a.position || !val_b.position) return 0
      return val_a.position.immutableValue - val_b.position.immutableValue
    })
  }

  const updateRowPositions = (table) => {
    table.forEach((row, index) => {
      if (row.position) {
        row.position.value = index
        row.position.max = table.length - 1
        row.position.altered = row.position.immutableValue !== row.position.value
      }
    })
  }

  const displayPositionExceededToast = () => {
    toast.add({
      closable: true,
      severity: 'info',
      summary: 'Invalid Position',
      detail:
        'The entered position exceeds the list limit. The rule has been moved to the last position in the list.'
    })
  }

  const checkPositionExceededMaxResults = (maxPosition) => {
    if (valueInputedUser.value > maxPosition) {
      displayPositionExceededToast()
      valueInputedUser.value = 0
    }
  }

  const changePosition = (updatedRow, newValue) => {
    checkPositionExceededMaxResults(updatedRow.position.max)
    const oldIndex = data.value.findIndex(
      (item) => item.id === updatedRow.id && item.phase?.content === updatedRow.phase?.content
    )
    if (oldIndex === -1) return

    const [movedItem] = data.value.splice(oldIndex, 1)
    movedItem.position.altered = true
    data.value.splice(newValue, 0, movedItem)
    updateRowPositions(data.value)
  }

  const onPositionChange = (updatedRow, newValue) => {
    changePosition(updatedRow, newValue)

    setTimeout(() => {
      const table = document.querySelector('.p-datatable')
      const rowElement = table?.querySelector(`#row-${newValue}`)

      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 150)
  }

  const stateClassRules = (rule) => {
    if (rule.isSkeletonRow) {
      return 'pointer-events-none'
    }
    if (rule.position?.altered) {
      return 'bg-altered'
    }
  }

  const onRowReorder = async (event) => {
    const { dragIndex, dropIndex } = event
    const row = data.value[dragIndex]
    if (row.position && row.position.max >= dropIndex && row.position.min <= dropIndex) {
      onPositionChange(row, dropIndex)
      emit('on-reorder', { event, data })
    }
  }

  // --- Business logic ---
  function listEdgeFirewallRulesEngineServiceWithDecorator(query) {
    return edgeFirewallRulesEngineService.listEdgeFirewallRulesEngineService({
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

  function openEditDrawer(item) {
    drawerRef.value.openEditDrawer(item.id)
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const reorderDecoratorService = async (rulesData, reloadFn) => {
    isLoadingButtonOrder.value = true
    try {
      await edgeFirewallRulesEngineService.reorderEdgeFirewallRulesEngineService(
        rulesData,
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
      reloadFn()
    }
  }

  const updateRulesOrder = async (rows, changedRows, reloadFn) => {
    dialog.open(orderDialog, {
      data: {
        rules: changedRows
      },
      onClose: ({ data: closeData }) => {
        if (closeData?.updated || closeData?.reset) {
          return reloadFn()
        }
        if (closeData?.save) {
          return reorderDecoratorService(rows, reloadFn)
        }
      }
    })
  }

  const openCreateRulesEngineDrawerByPhase = () => {
    handleCreateTrackEvent()
    drawerRef.value.openCreateDrawer()
  }

  onMounted(() => {
    selectedColumns.value = getColumns.value
    optionsColumns.value = getColumns.value.filter((col) => !col.hidden)
  })

  defineExpose({
    openCreateDrawer: openCreateRulesEngineDrawerByPhase,
    reload,
    data,
    columnOrderAltered,
    alteredRows
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
    @onSuccess="reload()"
  />

  <div
    class="max-w-full mt-4"
    data-testid="data-table-container"
  >
    <DataTable
      :data="data"
      :loading="isLoading"
      :dataKey="'id'"
      :rowHover="true"
      :pt="{
        thead: { class: !hasContentToList && 'hidden' },
        bodyrow: (rowData) => ({
          id: `row-${rowData.context.index}`,
          class: 'cursor-pointer'
        })
      }"
      containerClass="mt-4"
      v-model:filters="filters"
      :globalFilterFields="filterBy"
      v-model:selection="selectedItems"
      emptyListMessage="No rules found."
      :columns="selectedColumns"
      :rowClass="stateClassRules"
      @rowReorder="onRowReorder"
      @row-click="(event) => editItemSelected(event, event.data)"
      :emptyBlock="{
        title: 'No rules yet',
        description:
          'Create your first firewall rule to define security modules and enforcement behavior for incoming traffic.',
        createButtonLabel: 'Rule',
        documentationService: documentationService
      }"
      data-testid="rules-engine-list"
      @on-load-data="handleLoadData"
      @on-before-go-to-edit="handleTrackEditEvent"
    >
      <template #header>
        <DataTable.Header :showDivider="false">
          <template #first-line>
            <div class="flex justify-between gap-2 w-full">
              <DataTable.Search
                v-model="filters.global.value"
                @search="reload"
              />
              <div class="flex gap-2">
                <PrimeButton
                  outlined
                  icon="pi pi-refresh"
                  size="small"
                  @click="reload({ page: 1, skipCache: true })"
                  v-tooltip.top="{ value: 'Reload', showDelay: 200 }"
                  data-testid="data-table-actions-column-header-refresh"
                />
                <DataTable.Export @export="handleExportTableDataToCSV('Firewall Rules Engine')" />
                <DataTable.ColumnSelector
                  :columns="getColumns"
                  v-model:selectedColumns="selectedColumns"
                />
              </div>
            </div>
          </template>
        </DataTable.Header>
      </template>

      <DataTable.Column
        rowReorder
        headerStyle="width: 3rem"
        data-testid="data-table-reorder-column"
      >
        <template #body="{ data: rowData }">
          <div class="gap-4 align-items-center flex flex-row">
            <template v-if="rowData.isSkeletonRow">
              <i
                class="pi pi-bars cursor-move mr-4 hidden md:inline disabled-click-row"
                data-pc-section="rowreordericon"
              />
              <Skeleton
                width="7rem"
                height="2rem"
              />
            </template>
            <template v-else>
              <i
                class="pi pi-bars cursor-move mr-4 hidden md:inline disabled-click-row"
                data-pc-section="rowreordericon"
              />
              <InputNumber
                v-model="rowData.position.value"
                showButtons
                :allowEmpty="false"
                @update:modelValue="(value) => onPositionChange(rowData, value)"
                @input="(value) => (valueInputedUser = value.value)"
                buttonLayout="horizontal"
                class="disabled-click-row"
                :min="rowData.position.min"
                :max="rowData.position.max"
                :pt="{ input: { class: 'w-11 text-center' } }"
                data-testid="data-table-input-position"
              >
                <template #incrementbuttonicon>
                  <span class="pi pi-chevron-down" />
                </template>
                <template #decrementbuttonicon>
                  <span class="pi pi-chevron-up" />
                </template>
              </InputNumber>
            </template>
          </div>
        </template>
      </DataTable.Column>

      <DataTable.Column
        :sortable="!col.disableSort"
        v-for="col of selectedColumns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortField="col?.sortField"
        :class="[col.disableSort ? '' : 'hover:cursor-pointer', col.class]"
        data-testid="data-table-column"
        class="lg:break-words lg:whitespace-normal"
      >
        <template #body="{ data: rowData }">
          <div class="flex items-center gap-2">
            <template v-if="rowData.isSkeletonRow">
              <Skeleton class="h-[12px]" />
            </template>
            <template v-else>
              <template v-if="col.type !== 'component'">
                <div :data-testid="`list-table-block__column__${col.field}__row`">
                  {{ rowData[col.field] }}
                </div>
              </template>
              <template v-else>
                <component
                  :is="col.component(extractFieldValue(rowData, col.field))"
                  :data-testid="`list-table-block__column__${col.field}__row`"
                />
              </template>
              <PrimeTag
                v-if="
                  rowData.status !== undefined &&
                  rowData.status.content !== 'Active' &&
                  col.showInactiveTag
                "
                :value="rowData.status.content"
              />
            </template>
          </div>
        </template>
      </DataTable.Column>

      <DataTable.Column
        :frozen="true"
        :alignFrozen="'right'"
        class="w-1"
        headerStyle="width: 13rem"
        data-testid="data-table-actions-column"
      >
        <template
          #body="{ data: rowData }"
          v-if="isRenderActions"
        >
          <div class="flex items-center gap-2 justify-end">
            <template v-if="rowData.isSkeletonRow">
              <Skeleton
                width="1rem"
                height="2rem"
              />
            </template>
            <DataTable.RowActions
              v-else
              :rowData="rowData"
              :actions="actionOptions(rowData)"
              :onActionExecute="executeCommand"
              :onMenuToggle="toggleActionsMenu"
              :menuRefSetter="setMenuRefForRow"
            />
          </div>
        </template>
      </DataTable.Column>

      <template #empty>
        <slot name="noRecordsFound">
          <div class="my-4 flex flex-col gap-3 justify-center items-start">
            <p
              class="text-md font-normal text-secondary"
              data-testid="list-table-block__empty-message__text"
            >
              No rules found.
            </p>
          </div>
        </slot>
      </template>
      <template #emptyBlock>
        <slot name="emptyBlock" />
      </template>
      <template #emptyBlockButton>
        <PrimeButton
          icon="pi pi-plus"
          severity="secondary"
          label="Rule"
          @click="openCreateDrawer"
          data-testid="create_Rules Engine_button"
        />
      </template>
    </DataTable>

    <teleport
      to="#action-bar"
      v-if="columnOrderAltered && !isLoading"
    >
      <div
        class="flex w-full gap-4 justify-end h-14 items-center border-t surface-border sticky bottom-0 surface-section px-2 md:px-8"
      >
        <PrimeButton
          outlined
          label="Discard Changes"
          @click="discardChanges"
          data-testid="review-changes-dialog-footer-cancel-button"
        />
        <PrimeButton
          label="Review Changes"
          class="bg-surface"
          :badgeClass="badgeClass"
          data-testid="rules-engine-save-order-button"
          size="small"
          type="button"
          :loading="isLoadingButtonOrder"
          @click="updateRulesOrder(data, alteredRows, reload)"
          :badge="!isLoadingButtonOrder ? alteredRows.length : undefined"
        />
      </div>
    </teleport>
  </div>
</template>

<style lang="scss">
  .p-datatable {
    .p-datatable-tbody {
      > tr {
        > td {
          transition: color 0.2s ease;
        }
        &.p-datatable-dragpoint-top > td {
          box-shadow: inset 0 2px 0 0 var(--text-color);
        }

        &.p-datatable-dragpoint-bottom > td {
          box-shadow: inset 0 -2px 0 0 var(--text-color);
        }

        &.bg-altered {
          @media (prefers-color-scheme: dark) {
            background-color: var(--surface-500);
            .p-frozen-column {
              background-color: var(--surface-500);
            }
          }
          @media (prefers-color-scheme: light) {
            background-color: var(--surface-50);
            .p-frozen-column {
              background-color: var(--surface-50);
            }
          }
        }
      }
    }
  }

  .no-before::before {
    content: none !important;
  }
</style>
