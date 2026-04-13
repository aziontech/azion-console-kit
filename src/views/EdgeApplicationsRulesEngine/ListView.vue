<script setup>
  import { computed, ref, inject, onMounted } from 'vue'
  import { useDialog } from '@aziontech/webkit/use-dialog'
  import { useToast } from '@aziontech/webkit/use-toast'
  import PrimeButton from '@aziontech/webkit/button'
  import PrimeTag from '@aziontech/webkit/tag'
  import InputNumber from '@aziontech/webkit/inputnumber'
  import Skeleton from '@aziontech/webkit/skeleton'
  import { storeToRefs } from 'pinia'
  import { useThemeStore } from '@/stores/theme'
  import DrawerRulesEngine from '@/views/EdgeApplicationsRulesEngine/Drawer'
  import orderDialog from '@/views/EdgeApplicationsRulesEngine/Dialog/order-dialog.vue'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  // TODO: migrate import to @aziontech/webkit/list-data-table when published
  import DataTable from '@aziontech/webkit/list-data-table'
  import { useDataTable } from '@/composables/useDataTable'
  import { rulesEngineService } from '@/services/v2/edge-app/edge-app-rules-engine-service'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const dialog = useDialog()
  const toast = useToast()
  const { currentTheme } = storeToRefs(useThemeStore())

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
  const selectedPhase = ref('Request phase')
  const currentPhase = ref('request')
  const hasContentToList = ref(true)

  const emit = defineEmits([
    'on-load-data',
    'on-reorder',
    'on-before-go-to-add-page',
    'on-before-go-to-edit',
    'update:selectedItensData',
    'on-review-changes'
  ])

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

  const actions = computed(() => [
    {
      label: 'Delete',
      type: 'delete',
      title: 'rule',
      icon: 'pi pi-trash',
      service: deleteRulesEngineWithDecorator
    }
  ])

  // --- useDataTable integration ---
  const tableProps = {
    columns: getColumns,
    listService: listRulesEngineWithDecorator,
    actions,
    apiFields: RULES_ENGINE_API_FIELDS,
    emptyListMessage: 'No rules found.',
    exportFileName: 'Application Rules Engine',
    editInDrawer: openEditRulesEngineDrawer,
    isEdgeApplicationRulesEngine: true,
    expandedRowGroups: ['Default', 'Request', 'Response'],
    groupColumn: 'phase.content',
    isTabs: true,
    orderableRows: true,
    expandableRowGroups: true,
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

  // --- Position ordering logic (from v2/index.vue) ---
  const expandedGroups = ref(['Default', 'Request', 'Response'])
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

    const request = data.value.filter((item) => item.phase?.content === 'Request')
    const response = data.value.filter((item) => item.phase?.content === 'Response')

    request.sort((val_a, val_b) => val_a.position.immutableValue - val_b.position.immutableValue)
    response.sort((val_a, val_b) => val_a.position.immutableValue - val_b.position.immutableValue)

    data.value = [...request, ...response]
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

  const changePositionOnEdgeApplicationRulesEngine = (updatedRow, position) => {
    const targetPosition = parseInt(position, 10)
    if (isNaN(targetPosition)) return

    const ALL_RULES = data.value
    const currentRulePhase = updatedRow.phase?.content
    if (!currentRulePhase) return

    const response = ALL_RULES.filter((item) => item.phase?.content === 'Response')
    const request = ALL_RULES.filter((item) => item.phase?.content === 'Request')

    const rulesInCurrentPhase = currentRulePhase === 'Response' ? response : request
    const originalIndex = rulesInCurrentPhase.findIndex((rule) => rule.id === updatedRow.id)
    if (originalIndex === -1) return

    const maxAllowedPosition = rulesInCurrentPhase.length - 1
    let newPosition = targetPosition

    if (newPosition > maxAllowedPosition) {
      newPosition = maxAllowedPosition
      displayPositionExceededToast()
    }

    if (originalIndex === newPosition) return

    const firstRule = rulesInCurrentPhase.splice(originalIndex, 1)[0]

    firstRule.position.value = targetPosition
    firstRule.position.altered = newPosition !== firstRule.position.immutableValue

    rulesInCurrentPhase.splice(newPosition, 0, firstRule)

    updateRowPositions(rulesInCurrentPhase)
    data.value = [...request, ...response]
  }

  const onPositionChange = (updatedRow, newValue) => {
    changePositionOnEdgeApplicationRulesEngine(updatedRow, newValue)

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
    if (rule.status?.content === 'Inactive') {
      return 'opacity-50'
    }
  }

  const showInvalidMoveToast = () => {
    toast.add({
      severity: 'warn',
      summary: 'Invalid Action',
      detail: 'Rules can only be reordered within their own phase (Request or Response).',
      life: 3000
    })
  }

  const handleRuleDropToEdgeApplicationRulesEngine = (event) => {
    const { dragIndex, dropIndex } = event

    const rules = data.value
    const draggedRule = rules[dragIndex]
    const targetRule = rules[dropIndex]

    const isMoveInvalid =
      !draggedRule || !targetRule || draggedRule.phase?.content !== targetRule.phase?.content

    if (isMoveInvalid) {
      showInvalidMoveToast()
      reload()
      return
    }

    const [movedRule] = rules.splice(dragIndex, 1)
    rules.splice(dropIndex, 0, movedRule)

    const affectedPhase = draggedRule.phase.content
    const rulesInAffectedPhase = rules.filter((rule) => rule.phase?.content === affectedPhase)

    rulesInAffectedPhase.forEach((rule, index) => {
      const isTheRuleThatMoved = rule.id === movedRule.id
      const positionHasChanged = rule.position.value !== index

      if (isTheRuleThatMoved || positionHasChanged) {
        rule.position.value = index
        rule.position.altered = true
      }
    })

    updateRowPositions(rulesInAffectedPhase)
    emit('on-reorder', { event, data: rules })
  }

  const onRowReorder = async (event) => {
    handleRuleDropToEdgeApplicationRulesEngine(event)
  }

  const getObjectPath = (obj, path) => {
    return path.split('.').reduce((acc, key) => acc?.[key], obj)
  }

  const hasContentDefault = (content) => {
    return content === 'Default'
  }

  const toggleGroup = (groupData) => {
    const groupValue = getObjectPath(groupData, 'phase.content')
    const index = expandedGroups.value.indexOf(groupValue)

    if (index === -1) {
      expandedGroups.value.push(groupValue)
    } else {
      expandedGroups.value.splice(index, 1)
    }
  }

  // --- Business logic ---
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

  function listRulesEngineWithDecorator(params) {
    return rulesEngineService.listRulesEngineRequestAndResponsePhase({
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

  function openEditRulesEngineDrawer(item) {
    currentPhase.value = item.phase.content.toLowerCase()
    drawerRulesEngineRef.value.openDrawerEdit(item)
  }

  const isLoadingButtonOrder = ref(false)

  const reorderDecoratorService = async (rulesData, reloadFn) => {
    isLoadingButtonOrder.value = true
    try {
      await rulesEngineService.reorderRulesEngine(rulesData, props.edgeApplicationId)
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
      reloadFn()
    }
  }

  const updateRulesOrder = async (rows, changedRows, reloadFn) => {
    dialog.open(orderDialog, {
      data: {
        rules: changedRows,
        isEdgeApplicationRulesEngine: true
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

  const handleNavigateToMainSettings = () => {
    props.navigateToApplicationAccelerator()
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
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
  <DrawerRulesEngine
    ref="drawerRulesEngineRef"
    :isApplicationAcceleratorEnabled="isApplicationAcceleratorEnabled"
    :isImageOptimizationEnabled="isImageOptimizationEnabled"
    :listOriginsService="listOriginsService"
    :edgeApplicationId="edgeApplicationId"
    :documentationService="documentationService"
    :hideApplicationAcceleratorInDescription="hideApplicationAcceleratorInDescription"
    :isEdgeFunctionEnabled="isEdgeFunctionEnabled"
    :currentPhase="currentPhase"
    @onSuccess="reload()"
    data-testid="rules-engine-drawer"
    @navigate-to-main-settings="handleNavigateToMainSettings"
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
      v-model:expandedRowGroups="expandedGroups"
      :globalFilterFields="filterBy"
      v-model:selection="selectedItems"
      emptyListMessage="No rules found."
      :columns="selectedColumns"
      :expandableRowGroups="true"
      :rowGroupMode="'subheader'"
      :groupRowsBy="'phase.content'"
      :sortField="'phase.content'"
      :sortMode="'single'"
      :rowClass="stateClassRules"
      @rowReorder="onRowReorder"
      @row-click="(event) => editItemSelected(event, event.data)"
      :emptyBlock="{
        title: 'No rules engines yet',
        description:
          'Create your first rules engine to define conditional logic for your application.',
        documentationService: documentationService
      }"
      @on-load-data="handleLoadData"
      @on-before-go-to-edit="handleTrackEditEvent"
    >
      <template #header>
        <slot name="header">
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
                  <DataTable.Export
                    @export="handleExportTableDataToCSV('Application Rules Engine')"
                  />
                  <DataTable.ColumnSelector
                    :columns="getColumns"
                    v-model:selectedColumns="selectedColumns"
                  />
                </div>
              </div>
            </template>
          </DataTable.Header>
        </slot>
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
                :class="hasContentDefault(rowData.phase?.content) ? 'no-before mr-8' : ''"
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
                :class="hasContentDefault(rowData.phase?.content) ? 'no-before mr-8' : ''"
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
                :disabled="hasContentDefault(rowData.phase?.content)"
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

      <template #groupheader="slotProps">
        <div
          class="vertical-align-middle font-medium line-height-3 top-[-0.225rem] relative cursor-pointer inline-block"
          @click="toggleGroup(slotProps.data)"
        >
          {{ getObjectPath(slotProps.data, 'phase.content') }}
        </div>
      </template>

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
          <div
            v-if="rowData.phase?.content !== 'Default'"
            class="flex items-center gap-2 justify-end"
          >
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
          @click="openCreateRulesEngineDrawerByPhase"
          data-testid="rules-engine-create-button"
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
