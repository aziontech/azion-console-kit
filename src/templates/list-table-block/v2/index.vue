<template>
  <div
    class="max-w-full"
    :class="{ 'mt-4': isTabs }"
    data-testid="data-table-container"
  >
    <DataTable
      ref="dataTableRef"
      class="overflow-clip rounded-md"
      v-model:expandedRowGroups="expandedGroups"
      @rowReorder="onRowReorder"
      scrollable
      removableSort
      :value="data"
      dataKey="id"
      @row-click="editItemSelected"
      v-if="!isLoading"
      v-model:filters="filters"
      :globalFilterFields="filterBy"
      v-model:selection="selectedItems"
      :loading="isLoading"
      data-testid="data-table"
      expandableRowGroups
      rowGroupMode="subheader"
      :groupRowsBy="props.groupColumn"
      :sortField="props.groupColumn"
      sortMode="single"
      :rowClass="stateClassRules"
      :pt="{
        bodyrow: (rowData) => ({
          id: `row-${rowData.context.index}`
        })
      }"
    >
      <template
        #header
        v-if="!props.hiddenHeader"
      >
        <slot name="header">
          <div
            class="flex flex-wrap justify-between gap-2 w-full"
            data-testid="data-table-header"
          >
            <span
              class="flex flex-row p-input-icon-left items-center max-sm:w-full"
              data-testid="data-table-search"
            >
              <i class="pi pi-search" />
              <InputText
                class="h-8 w-full md:min-w-[20rem]"
                v-model.trim="filters.global.value"
                data-testid="data-table-search-input"
                placeholder="Search"
              />
            </span>

            <slot
              name="addButton"
              data-testid="data-table-add-button"
              :reload="reload"
              :data="data"
              :columnOrderAltered="columnOrderAltered"
              :alteredRows="alteredRows"
            >
              <PrimeButton
                class="max-sm:w-full"
                @click="navigateToAddPage"
                icon="pi pi-plus"
                :data-testid="`create_${addButtonLabel}_button`"
                :label="addButtonLabel"
                v-if="addButtonLabel"
              />
            </slot>
          </div>
        </slot>
      </template>

      <Column
        v-if="orderableRows"
        rowReorder
        headerStyle="width: 3rem"
        data-testid="data-table-reorder-column"
      >
        <template #body="{ data: rowData }">
          <div class="gap-4 align-items-center flex flex-row">
            <i
              class="pi pi-bars cursor-move mr-4 hidden md:inline disabled-click-row"
              data-pc-section="rowreordericon"
              v-if="rowData.phase.content !== 'Default'"
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
              :disabled="rowData.phase.content === 'Default'"
            >
              <template #incrementbuttonicon>
                <span class="pi pi-chevron-down" />
              </template>
              <template #decrementbuttonicon>
                <span class="pi pi-chevron-up" />
              </template>
            </InputNumber>
          </div>
        </template>
      </Column>

      <template
        #groupheader="slotProps"
        v-if="props.groupColumn"
      >
        <span class="vertical-align-middle font-bold line-height-3 absolute left-16 top-4">
          {{ getObjectPath(slotProps.data, props.groupColumn) }}
        </span>
      </template>

      <Column
        v-if="showSelectionMode"
        selectionMode="multiple"
        headerStyle="width: 3rem"
      />

      <Column
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
        </template>
      </Column>

      <Column
        :frozen="true"
        :alignFrozen="'right'"
        class="w-1"
        headerStyle="width: 13rem"
        data-testid="data-table-actions-column"
      >
        <template #header>
          <div
            class="flex justify-end w-full"
            data-testid="data-table-actions-column-header"
          >
            <PrimeButton
              outlined
              icon="ai ai-column"
              class="table-button"
              @click="toggleColumnSelector"
              v-tooltip.top="{ value: 'Hidden Columns', showDelay: 200 }"
              data-testid="data-table-actions-column-header-toggle-columns"
            >
            </PrimeButton>
            <OverlayPanel
              ref="columnSelectorPanel"
              :pt="{
                content: { class: 'p-0' }
              }"
              data-testid="data-table-actions-column-header-toggle-columns-panel"
            >
              <Listbox
                v-model="selectedColumns"
                multiple
                :options="[{ label: 'Hidden Columns', items: optionsColumns }]"
                class="hidden-columns-panel"
                optionLabel="header"
                optionGroupLabel="label"
                optionGroupChildren="items"
                data-testid="data-table-actions-column-header-toggle-columns-panel-listbox"
              >
                <template #optiongroup="slotProps">
                  <p class="text-sm font-medium">{{ slotProps.option.label }}</p>
                </template>
              </Listbox>
            </OverlayPanel>
          </div>
        </template>
        <template
          #body="{ data: rowData }"
          v-if="isRenderActions"
        >
          <div v-if="rowData.phase.content !== 'Default'">
            <div
              class="flex justify-end"
              v-if="isRenderOneOption"
              data-testid="data-table-actions-column-body-action"
            >
              <PrimeButton
                size="small"
                outlined
                v-bind="optionsOneAction(rowData)"
                @click="executeCommand(rowData)"
                class="cursor-pointer table-button"
                data-testid="data-table-actions-column-body-action-button"
              />
            </div>
            <div
              class="flex justify-end"
              v-else
              data-testid="data-table-actions-column-body-actions"
            >
              <PrimeMenu
                :ref="setMenuRefForRow(rowData.id)"
                id="overlay_menu"
                v-bind:model="actionOptions(rowData)"
                :popup="true"
                data-testid="data-table-actions-column-body-actions-menu"
                :pt="{
                  menuitem: ({ context }) => ({
                    'data-testid': `data-table__actions-menu-item__${context.item?.label}-button`
                  })
                }"
              />
              <PrimeButton
                v-tooltip.top="{ value: 'Actions', showDelay: 200 }"
                size="small"
                icon="pi pi-ellipsis-h"
                outlined
                @click="(event) => toggleActionsMenu(event, rowData.id)"
                class="cursor-pointer table-button"
                data-testid="data-table-actions-column-body-actions-menu-button"
              />
            </div>
          </div>
        </template>
      </Column>

      <template #empty>
        <slot
          name="noRecordsFound"
          data-testid="data-table-empty-content"
        >
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
    </DataTable>
    <DataTable
      v-else
      :value="Array(10)"
      :pt="{
        header: { class: '!border-t-0' }
      }"
      data-testid="data-table-skeleton"
    >
      <template
        #header
        v-if="!props.hiddenHeader"
      >
        <slot name="header">
          <div
            class="flex flex-wrap justify-between gap-2 w-full"
            data-testid="data-table-skeleton-header"
          >
            <span
              class="flex flex-row h-8 p-input-icon-left max-sm:w-full"
              data-testid="data-table-skeleton-search"
            >
              <i class="pi pi-search" />
              <InputText
                class="w-full h-8 md:min-w-[20rem]"
                v-model="filters.global.value"
                placeholder="Search"
                data-testid="data-table-skeleton-search-input"
              />
            </span>
            <slot
              name="addButton"
              data-testid="data-table-add-button"
            >
              <PrimeButton
                class="max-sm:w-full"
                @click="navigateToAddPage"
                icon="pi pi-plus"
                :label="addButtonLabel"
                v-if="addButtonLabel"
                data-testid="data-table-skeleton-add-button"
              />
            </slot>
          </div>
        </slot>
      </template>

      <template
        #groupheader="slotProps"
        v-if="props.groupColumn"
      >
        <span class="vertical-align-middle ml-2 font-bold line-height-3">
          {{ getObjectPath(slotProps.data, props.groupColumn) }}
        </span>
      </template>

      <Column
        v-for="col of columns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        data-testid="data-table-skeleton-column"
      >
        <template #body>
          <Skeleton />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
<script setup>
  import { FilterMatchMode } from 'primevue/api'
  import PrimeButton from 'primevue/button'
  import Column from 'primevue/column'
  import DataTable from 'primevue/datatable'
  import InputText from 'primevue/inputtext'
  import Listbox from 'primevue/listbox'
  import PrimeMenu from 'primevue/menu'
  import OverlayPanel from 'primevue/overlaypanel'
  import Skeleton from 'primevue/skeleton'
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import DeleteDialog from '../dialog/delete-dialog.vue'
  import { useDialog } from 'primevue/usedialog'
  import { useToast } from 'primevue/usetoast'
  import InputNumber from 'primevue/inputnumber'

  defineOptions({ name: 'list-table-block-new' })

  const emit = defineEmits([
    'on-load-data',
    'on-reorder',
    'on-before-go-to-add-page',
    'on-before-go-to-edit',
    'update:selectedItensData'
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
    }
  })

  const isRenderActions = !!props.actions?.length
  const isRenderOneOption = props.actions?.length === 1
  const selectedId = ref(null)
  const dataTableRef = ref(null)
  const expandedGroups = ref(props.expandedRowGroups)

  const filters = ref({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
  })

  const isLoading = ref(false)
  const data = ref([])
  const selectedColumns = ref([])
  const columnSelectorPanel = ref(null)
  const menuRef = ref({})
  const valueInputedUser = ref(0)

  const dialog = useDialog()
  const router = useRouter()
  const toast = useToast()

  const totalRecords = ref()
  const savedSearch = ref('')

  const firstLoadData = ref(true)

  const selectedItems = computed({
    get: () => {
      return props.selectedItensData
    },
    set: (value) => {
      emit('update:selectedItensData', value)
    }
  })

  const columnOrderAltered = computed(() => {
    return data.value.some((row) => row.position.altered)
  })

  const alteredRows = computed(() => {
    return data.value.filter((row) => row.position.altered)
  })

  const updateRowPositions = () => {
    data.value.forEach((row, index) => {
      row.position.value = index
      row.position.altered =
        row.position.altered && row.position.immutableValue !== row.position.value
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

  const onPositionChange = (updatedRow, newValue) => {
    checkPositionExceededMaxResults(updatedRow.position.max)
    const oldIndex = data.value.findIndex((item) => item.id === updatedRow.id)
    if (oldIndex === -1) return

    const [movedItem] = data.value.splice(oldIndex, 1)
    movedItem.position.altered = true
    data.value.splice(newValue, 0, movedItem)
    updateRowPositions()
    setTimeout(() => {
      const table = document.querySelector('.p-datatable')
      const rowElement = table?.querySelector(`#row-${movedItem.position.value}`)

      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 150)
  }

  const toggleColumnSelector = (event) => {
    columnSelectorPanel.value.toggle(event)
  }

  const stateClassRules = (rule) => {
    if (rule.position.altered) {
      return 'bg-altered'
    }
  }

  const onRowReorder = async (event) => {
    const { dragIndex, dropIndex } = event
    const row = data.value[dragIndex]
    if (data.value[dropIndex].name === 'Default Rule') return
    if (row.position.max >= dropIndex && row.position.min <= dropIndex) {
      onPositionChange(row, dropIndex)
      emit('on-reorder', { event, data })
    }
  }

  const openDialog = (dialogComponent, body) => {
    dialog.open(dialogComponent, body)
  }

  const actionOptions = (rowData) => {
    const createActionOption = (action) => {
      return {
        ...action,
        disabled: action.disabled && action.disabled(rowData),
        command: () => {
          switch (action.type) {
            case 'dialog':
              openDialog(action.dialog.component, action.dialog.body(rowData, reload))
              break
            case 'delete':
              {
                const bodyDelete = {
                  data: {
                    title: action.title,
                    selectedID: rowData.id,
                    selectedItemData: rowData,
                    deleteDialogVisible: true,
                    deleteService: action.service,
                    rerender: Math.random()
                  },
                  onClose: (opt) => opt.data.updated && reload()
                }
                openDialog(DeleteDialog, bodyDelete)
              }
              break
            case 'action':
              action.commandAction(rowData)
              break
          }
        }
      }
    }

    const actions = props.actions
      .filter((action) => !action.visibleAction || action.visibleAction(rowData))
      .map(createActionOption)

    return actions
  }

  const loadData = async ({ page, ...query }) => {
    if (props.listService) {
      try {
        isLoading.value = true
        const { count = 0, body = [] } = props.isGraphql
          ? await props.listService()
          : await props.listService({ page, ...query })
        data.value = body
        totalRecords.value = count
      } catch (error) {
        const errorMessage = error.message || error
        toast.add({
          closable: true,
          severity: 'error',
          summary: 'error',
          detail: errorMessage
        })
      } finally {
        isLoading.value = false
        if (firstLoadData.value) {
          const hasData = data.value?.length > 0
          emit('on-load-data', !!hasData)
        }
        firstLoadData.value = false
      }
    }
  }

  const navigateToAddPage = () => {
    emit('on-before-go-to-add-page')
    router.push(props.createPagePath)
  }

  const toggleActionsMenu = (event, selectedID) => {
    if (!selectedID) {
      throw new Error('Please provide an id for each data item through the service adapter')
    }
    selectedId.value = selectedID
    menuRef.value[selectedID].toggle(event)
  }

  const editItemSelected = (event) => {
    const { data: item } = event
    if (
      event.originalEvent.target.classList.contains('disabled-click-row') ||
      event.originalEvent.target.parentElement.classList.contains('disabled-click-row') ||
      columnOrderAltered.value
    ) {
      return
    }
    emit('on-before-go-to-edit', item)
    if (props.editInDrawer) {
      props.editInDrawer(item)
    } else if (props.enableEditClick) {
      router.push({ path: `${props.editPagePath}/${item.id}` })
    }
  }

  const executeCommand = (rowData) => {
    const [firstAction] = actionOptions(rowData)
    firstAction?.command()
  }

  const optionsOneAction = (rowData) => {
    const [firstAction] = actionOptions(rowData)
    return {
      icon: firstAction?.icon,
      disabled: firstAction?.disabled
    }
  }

  const reload = async (query = {}) => {
    const commonParams = {
      fields: props.apiFields,
      ...query
    }

    if (props.lazy) {
      commonParams.search = savedSearch.value
    }

    loadData(commonParams)
  }

  const getObjectPath = (obj, path) => {
    return path.split('.').reduce((acc, key) => acc?.[key], obj)
  }

  const extractFieldValue = (rowData, field) => {
    return rowData[field]
  }

  const setMenuRefForRow = (rowDataID) => {
    return (document) => {
      if (document !== null) {
        menuRef.value[rowDataID] = document
      }
    }
  }

  const filterBy = computed(() => {
    const filtersPath = props.columns.filter((el) => el.filterPath).map((el) => el.filterPath)
    const filters = props.columns.map((item) => item.field)

    return [...filters, ...filtersPath]
  })

  const optionsColumns = ref([])
  onMounted(() => {
    loadData({
      fields: props.apiFields,
      ordering: props.defaultOrderingFieldName
    })
    selectedColumns.value = props.columns
    optionsColumns.value = props.columns.filter((col) => !col.hidden)
  })

  defineExpose({ reload })
</script>
<style lang="scss">
  .p-datatable {
    .p-datatable-tbody {
      > tr {
        &.p-datatable-dragpoint-top > td {
          box-shadow: inset 0 2px 0 0 var(--text-color);
        }

        &.p-datatable-dragpoint-bottom > td {
          box-shadow: inset 0 -2px 0 0 var(--text-color);
        }

        &.bg-altered {
          @media (prefers-color-scheme: dark) {
            background-color: var(--surface-500);
          }
          @media (prefers-color-scheme: light) {
            background-color: var(--surface-50);
          }
        }
      }
    }
  }
</style>
