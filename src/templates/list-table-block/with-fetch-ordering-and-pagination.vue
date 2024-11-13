<template>
  <div
    class="max-w-full"
    :class="{ 'mt-4': isTabs }"
    data-testid="data-table-container"
  >
    <DataTable
      scrollable
      removableSort
      rowHover
      lazy
      ref="dataTableRef"
      class="overflow-clip rounded-md"
      dataKey="id"
      data-testid="data-table"
      v-if="!isLoading"
      :pt="props.pt"
      :value="data"
      v-model:sortField="sortFieldValue"
      v-model:sortOrder="sortOrderValue"
      :paginator="true"
      :rowsPerPageOptions="[10, 20, 50, 100]"
      :rows="itemsByPage"
      :globalFilterFields="filterBy"
      :selection="selectedItems"
      :exportFilename="exportFileName"
      :exportFunction="exportFunctionMapper"
      :loading="isLoading"
      :totalRecords="totalRecords"
      :first="firstItemIndex"
      @rowReorder="onRowReorder"
      @row-click="editItemSelected"
      @page="changeNumberOfLinesPerPage"
      @sort="fetchOnSort"
    >
      <template
        #header
        v-if="!props.hiddenHeader"
      >
        <slot
          name="header"
          :exportTableCSV="handleExportTableDataToCSV"
        >
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
                @keyup.enter="fetchOnSearch"
                @input="handleSearchValue(false)"
              />
            </span>

            <PrimeButton
              v-if="hasExportToCsvMapper"
              @click="handleExportTableDataToCSV"
              outlined
              class="max-sm:w-full ml-auto"
              icon="pi pi-download"
              :data-testid="`export_button`"
              v-tooltip.bottom="{ value: 'Export to CSV', showDelay: 200 }"
            />

            <slot
              name="addButton"
              data-testid="data-table-add-button"
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
        v-if="reorderableRows"
        rowReorder
        headerStyle="width: 3rem"
        data-testid="data-table-reorder-column"
      />

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
        :class="{ 'hover:cursor-pointer': !col.disableSort }"
        data-testid="data-table-column"
      >
        <template #body="{ data: rowData }">
          <template v-if="col.type !== 'component'">
            <div
              v-html="rowData[col.field]"
              :data-testid="`list-table-block__column__${col.field}__row`"
            />
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
                :options="[{ label: 'Hidden Columns', items: columns }]"
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
      <Column
        sortable
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
  import DeleteDialog from './dialog/delete-dialog.vue'
  import { useDialog } from 'primevue/usedialog'
  import { useToast } from 'primevue/usetoast'
  import { getCsvCellContentFromRowData } from '@/helpers'
  import { getArrayChangedIndexes } from '@/helpers/get-array-changed-indexes'
  import { useTableDefinitionsStore } from '@/stores/table-definitions'

  defineOptions({ name: 'list-table-block-new' })

  const emit = defineEmits([
    'on-load-data',
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
    lazyLoad: {
      type: Boolean
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
    reorderableRows: {
      type: Boolean
    },
    onReorderService: {
      type: Function
    },
    isReorderAllEnabled: {
      type: Boolean,
      default: false
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
    csvMapper: {
      type: Function
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
      default: () => 'id'
    }
  })

  const tableDefinitions = useTableDefinitionsStore()

  const itemsByPage = ref(tableDefinitions.getNumberOfLinesPerPage)
  const isRenderActions = !!props.actions?.length
  const isRenderOneOption = props.actions?.length === 1
  const selectedId = ref(null)
  const dataTableRef = ref(null)
  const filters = ref({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
  })
  const isLoading = ref(false)
  const data = ref([])
  const selectedColumns = ref([])
  const columnSelectorPanel = ref(null)
  const menuRef = ref({})
  const hasExportToCsvMapper = ref(!!props.csvMapper)

  const dialog = useDialog()
  const router = useRouter()
  const toast = useToast()

  const sortFieldValue = ref(null)
  const sortOrderValue = ref(null)

  const totalRecords = ref()
  const firstItemIndex = ref(1)
  const savedSearch = ref('')
  const savedOrdering = ref('')

  const firstLoadData = ref(true)

  const selectedItems = computed({
    get: () => {
      return props.selectedItensData
    },
    set: (value) => {
      emit('update:selectedItensData', value)
    }
  })
  onMounted(() => {
    if (!props.lazyLoad) {
      loadData({
        page: 1,
        pageSize: itemsByPage.value,
        fields: props.apiFields,
        ordering: props.defaultOrderingFieldName
      })
    }
    selectedColumns.value = props.columns
  })
  /**
   * @param {import('primevue/datatable').DataTableExportFunctionOptions} rowData
   */
  const exportFunctionMapper = (rowData) => {
    if (!hasExportToCsvMapper.value) {
      return
    }
    const columnMapper = props.csvMapper(rowData)
    return getCsvCellContentFromRowData({ columnMapper, rowData })
  }
  const handleExportTableDataToCSV = () => {
    dataTableRef.value.exportCSV()
  }
  const toggleColumnSelector = (event) => {
    columnSelectorPanel.value.toggle(event)
  }
  const onRowReorder = async (event) => {
    try {
      const tableData = getArrayChangedIndexes(data.value, event.value, props.isReorderAllEnabled)
      data.value = event.value
      await props.onReorderService(tableData)
      reload()
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Reorder saved'
      })
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
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
  const editItemSelected = ({ data: item }) => {
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
    loadData({
      page: 1,
      pageSize: itemsByPage.value,
      fields: props.apiFields,
      search: savedSearch.value,
      ordering: savedOrdering.value,
      ...query
    })
  }

  defineExpose({ reload, handleExportTableDataToCSV })

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
  const changeNumberOfLinesPerPage = (event) => {
    const numberOfLinesPerPage = event.rows
    tableDefinitions.setNumberOfLinesPerPage(numberOfLinesPerPage)
    itemsByPage.value = numberOfLinesPerPage

    firstItemIndex.value = event.first
    reload({ page: event.page + 1 })
  }

  const filterBy = computed(() => {
    const filtersPath = props.columns.filter((el) => el.filterPath).map((el) => el.filterPath)
    const filters = props.columns.map((item) => item.field)

    return [...filters, ...filtersPath]
  })

  const handleStatusOrder = (sortOrder) => {
    if (sortOrder > 0) {
      return 'status=active'
    }
    return 'status=pending'
  }

  const fetchOnSort = async (event) => {
    const { sortField, sortOrder } = event
    let ordering = sortOrder === -1 ? `-${sortField}` : sortField
    if (sortField === 'status') ordering = handleStatusOrder(sortOrder)
    ordering = ordering === null ? props.defaultOrderingFieldName : ordering

    await reload({ ordering })

    savedOrdering.value = ordering
    sortFieldValue.value = sortField
    sortOrderValue.value = sortOrder
  }
  const fetchOnSearch = () => {
    reload()
  }

  const handleSearchValue = () => {
    const search = filters.value.global.value
    savedSearch.value = search
  }
</script>
