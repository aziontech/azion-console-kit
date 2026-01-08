<script setup>
  import { computed, onMounted, ref } from 'vue'
  import DataTable from '@/components/DataTable'
  import PrimeButton from 'primevue/button'
  import PrimeTag from 'primevue/tag'
  import InputNumber from 'primevue/inputnumber'
  import Skeleton from 'primevue/skeleton'
  import { useToast } from 'primevue/usetoast'
  import { useDataTable } from '@/composables/useDataTable'
  import { storeToRefs } from 'pinia'
  import { useAccountStore } from '@/stores/account'

  const { currentTheme } = storeToRefs(useAccountStore())

  defineOptions({ name: 'list-table-block-v2' })

  const emit = defineEmits([
    'on-load-data',
    'on-reorder',
    'on-before-go-to-add-page',
    'on-before-go-to-edit',
    'update:selectedItensData',
    'on-review-changes'
  ])

  const props = defineProps({
    hiddenHeader: {
      type: Boolean
    },
    columns: {
      type: Array,
      default: () => [{ field: 'name', header: 'Name' }]
    },
    groupColumn: {
      type: String
    },
    expandedRowGroups: {
      type: Array,
      default: () => []
    },
    isGraphql: {
      type: Boolean
    },
    createPagePath: {
      type: String,
      default: () => '/'
    },
    editPagePath: {
      type: String,
      default: () => '/'
    },
    editInDrawer: {
      type: Function
    },
    addButtonLabel: {
      type: String,
      default: () => ''
    },
    listService: {
      required: true,
      type: Function
    },
    enableEditClick: {
      type: Boolean,
      default: true
    },
    orderableRows: {
      type: Boolean
    },
    emptyListMessage: {
      type: String,
      default: () => 'No registers found.'
    },
    actions: {
      type: Array,
      default: () => []
    },
    isTabs: {
      type: Boolean,
      default: false
    },
    showSelectionMode: {
      type: Boolean
    },
    selectedItensData: {
      type: Array,
      default: () => []
    },
    exportFileName: {
      type: String
    },
    pt: {
      type: Object,
      default: () => ({})
    },
    apiFields: {
      type: Array,
      default: () => []
    },
    defaultOrderingFieldName: {
      type: String,
      default: () => ''
    },
    expandableRowGroups: {
      type: Boolean,
      default: false
    },
    isEdgeApplicationRulesEngine: {
      type: Boolean,
      default: false
    },
    showLastModified: {
      type: Boolean,
      default: false
    },
    showContrastInactiveLine: {
      type: Boolean,
      default: false
    },
    emptyBlock: {
      type: Object,
      default: () => ({})
    }
  })

  const toast = useToast()

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
    extractFieldValue
  } = useDataTable(props, emit)

  const expandedGroups = ref(props.expandedRowGroups)
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

    if (props.isEdgeApplicationRulesEngine) {
      const request = data.value.filter((item) => item.phase?.content === 'Request')
      const response = data.value.filter((item) => item.phase?.content === 'Response')

      request.sort((val_a, val_b) => val_a.position.immutableValue - val_b.position.immutableValue)
      response.sort((val_a, val_b) => val_a.position.immutableValue - val_b.position.immutableValue)

      data.value = [...request, ...response]
    } else {
      data.value.sort((val_a, val_b) => {
        if (!val_a.position || !val_b.position) return 0
        return val_a.position.immutableValue - val_b.position.immutableValue
      })
    }
  }

  const updateRowPositions = (table) => {
    table.forEach((row, index) => {
      if (row.position) {
        row.position.value = index
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

  const changePositionOnEdgeApplicationRulesEngine = (updatedRow, position) => {
    const targetPosition = parseInt(position, 10)
    if (isNaN(targetPosition)) return

    const ALL_RULES = data.value
    const currentPhase = updatedRow.phase?.content
    if (!currentPhase) return

    const response = ALL_RULES.filter((item) => item.phase?.content === 'Response')
    const request = ALL_RULES.filter((item) => item.phase?.content === 'Request')

    const rulesInCurrentPhase = currentPhase === 'Response' ? response : request
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
    if (!props.isEdgeApplicationRulesEngine) {
      changePosition(updatedRow, newValue)
    } else {
      changePositionOnEdgeApplicationRulesEngine(updatedRow, newValue)
    }

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
    if (props.showContrastInactiveLine && rule.status?.content === 'Inactive') {
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
    if (!props.isEdgeApplicationRulesEngine) {
      const { dragIndex, dropIndex } = event
      const row = data.value[dragIndex]
      if (row.position && row.position.max >= dropIndex && row.position.min <= dropIndex) {
        onPositionChange(row, dropIndex)
        emit('on-reorder', { event, data })
      }
    } else {
      handleRuleDropToEdgeApplicationRulesEngine(event)
    }
  }

  const getObjectPath = (obj, path) => {
    return path.split('.').reduce((acc, key) => acc?.[key], obj)
  }

  const hasContentDefault = (content) => {
    return content === 'Default'
  }

  const toggleGroup = (groupData) => {
    const groupValue = getObjectPath(groupData, props.groupColumn)
    const index = expandedGroups.value.indexOf(groupValue)

    if (index === -1) {
      expandedGroups.value.push(groupValue)
    } else {
      expandedGroups.value.splice(index, 1)
    }
  }

  onMounted(() => {
    selectedColumns.value = props.columns
    optionsColumns.value = props.columns.filter((col) => !col.hidden)
  })

  defineExpose({ reload, data, columnOrderAltered, alteredRows })
</script>

<template>
  <div
    class="max-w-full"
    :class="{ 'mt-4': isTabs }"
    data-testid="data-table-container"
  >
    <DataTable
      :data="data"
      :loading="isLoading"
      :dataKey="'id'"
      :rowHover="true"
      :pt="{
        ...pt,
        bodyrow: (rowData) => ({
          id: `row-${rowData.context.index}`,
          class: 'cursor-pointer'
        })
      }"
      :containerClass="{ 'mt-4': isTabs }"
      v-model:filters="filters"
      v-model:expandedRowGroups="expandedGroups"
      :globalFilterFields="filterBy"
      v-model:selection="selectedItems"
      :emptyListMessage="emptyListMessage"
      :columns="selectedColumns"
      :expandableRowGroups="expandableRowGroups"
      :rowGroupMode="'subheader'"
      :groupRowsBy="groupColumn"
      :sortField="groupColumn"
      :sortMode="'single'"
      :rowClass="stateClassRules"
      @rowReorder="onRowReorder"
      @row-click="(event) => editItemSelected(event, event.data)"
      :emptyBlock="emptyBlock"
    >
      <template
        #header
        v-if="!hiddenHeader"
      >
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
                  <DataTable.ColumnSelector
                    :columns="columns"
                    v-model:selectedColumns="selectedColumns"
                  />
                </div>
              </div>
            </template>
          </DataTable.Header>
        </slot>
      </template>

      <DataTable.Column
        v-if="orderableRows"
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

      <template
        #groupheader="slotProps"
        v-if="groupColumn"
      >
        <div
          class="vertical-align-middle font-medium line-height-3 absolute left-16 top-4 cursor-pointer"
          @click="toggleGroup(slotProps.data)"
        >
          {{ getObjectPath(slotProps.data, groupColumn) }}
        </div>
      </template>

      <DataTable.Column
        v-if="showSelectionMode"
        selectionMode="multiple"
        headerStyle="width: 3rem"
      />

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
              {{ emptyListMessage }}
            </p>
          </div>
        </slot>
      </template>
      <template #emptyBlock>
        <slot name="emptyBlock" />
      </template>
      <template #emptyBlockButton>
        <slot name="emptyBlockButton" />
      </template>
    </DataTable>

    <teleport
      to="#action-bar"
      v-if="columnOrderAltered"
    >
      <slot
        name="reorderFooter"
        :reload="reload"
        :discardChanges="discardChanges"
        :data="data"
        :alteredRows="alteredRows"
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
            @click="
              emit('on-review-changes', { data: data, alteredRows: alteredRows, reload: reload })
            "
            :badge="alteredRows.length"
          />
        </div>
      </slot>
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
