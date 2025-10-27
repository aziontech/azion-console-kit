<template>
  <div
    class="max-w-full"
    :class="{ 'mt-4': isTabs }"
    data-testid="data-table-container"
  >
    <DataTable
      v-if="!isLoading"
      ref="dataTableRef"
      :pt="parsedDatatablePt"
      class="overflow-clip rounded-md"
      scrollable
      removableSort
      :value="filterData"
      :paginator="paginator"
      :rowsPerPageOptions="[10, 20, 50, 100]"
      :rows="minimumOfItemsPerPage"
      v-model:selection="selectedItems"
      @page="changeNumberOfLinesPerPage"
      :globalFilterFields="filterBy"
      :loading="isLoading"
      data-testid="data-table"
      rowHover
      :rowClass="stateClassRules"
      :class="[
        'overflow-clip rounded-md table-with-orange-borders',
        { 'outline-visible': !cellQuickActions.rowData?.isFolder && cellQuickActions.visible }
      ]"
      scrollHeight="calc(100vh - 400px)"
      paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown JumpToPageInput"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
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
              />
            </span>

            <slot
              name="addButton"
              data-testid="data-table-add-button"
            >
              <PrimeButton
                class="max-sm:w-full"
                :disabled="disabledList"
                @click="navigateToAddPage"
                icon="pi pi-plus"
                size="small"
                :data-testid="`create_${addButtonLabel}_button`"
                :label="addButtonLabel"
                v-if="addButtonLabel"
              />
            </slot>
          </div>
        </slot>
      </template>
      <Column
        :class="{ '!hover:cursor-pointer': !disabledList }"
        headerStyle="width: 3rem"
      >
        <template #header>
          <Checkbox
            :model-value="isAllSelected"
            @update:model-value="toggleSelectAll"
            binary
          />
        </template>
        <template #body="{ data: rowData }">
          <div
            @click="toggleRowSelection(rowData)"
            class="cursor-pointer flex items-center justify-center w-6 h-8"
            data-testid="data-table-row-checkbox"
          >
            <Checkbox
              v-if="selectedItems.includes(rowData)"
              :model-value="selectedItems.includes(rowData)"
              @update:model-value="toggleRowSelection(rowData)"
              @click.stop="toggleRowSelection(rowData)"
              binary
            />
            <i
              v-else
              class="text-xl"
              :class="getFileIcon(rowData)"
            ></i>
          </div>
        </template>
      </Column>
      <Column
        :sortable="selectedItems.length > 0 ? false : !col.disableSort"
        v-for="(col, index) of selectedColumns"
        :key="col.field"
        :field="col.field"
        :header="selectedItems.length === 0 ? col.header : ''"
        :sortField="selectedItems.length > 0 ? null : col?.sortField"
        headerClass="relative h-16 w-[20rem]"
        :class="{ 'hover:cursor-pointer ': !disabledList }"
        data-testid="data-table-column"
      >
        <template
          #header
          v-if="selectedItems.length > 0 && index === 0"
        >
          <div class="flex items-center gap-5 absolute w-fit overflow-visible z-10">
            <span class="text-sm">{{ selectedItems.length }} files selected</span>
            <div class="flex gap-2">
              <PrimeButton
                size="small"
                outlined
                icon="pi pi-arrow-right-arrow-left"
                label="Move"
                class="px-4"
              />
              <PrimeButton
                size="small"
                outlined
                :icon="isDownloading ? 'pi pi-spin pi-spinner' : 'pi pi-download'"
                label="Download"
                class="px-4"
                :disabled="isDownloading"
                @click="emit('download-selected-items')"
              />
              <PrimeButton
                size="small"
                icon="pi pi-trash"
                label="Delete"
                severity="danger"
                class="px-4"
                @click="emit('delete-selected-items')"
              />
            </div>
          </div>
        </template>
        <template #body="{ data: rowData }">
          <template v-if="col.type !== 'component'">
            <div
              class="text-[12px]"
              @click="editItemSelected(rowData)"
              v-html="rowData[col.field]"
              :data-testid="`list-table-block__column__${col.field}__row`"
            />
          </template>
          <template v-else>
            <component
              @click="editItemSelected(rowData)"
              :is="col.component(extractFieldValue(rowData, col.field))"
              :data-testid="`list-table-block__column__${col.field}__row`"
              class="text-[12px]"
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
            class="flex items-center gap-2 justify-end w-full"
            data-testid="data-table-actions-column-header"
          >
            <span
              @click="sortByLastModified"
              v-if="showLastModified"
              class="cursor-pointer select-none flex items-center gap-2 group"
              data-testid="last-modified-header-sort"
            >
              <i
                v-if="sortFieldValue === 'lastModified'"
                :class="{
                  'pi pi-sort-amount-up-alt': sortOrderValue === 1,
                  'pi pi-sort-amount-down': sortOrderValue === -1
                }"
              />
              <i
                v-else
                class="pi pi-sort-alt opacity-0 group-hover:opacity-100 transition-opacity"
              />
              Last Modified
            </span>
            <PrimeButton
              outlined
              icon="ai ai-column"
              class="table-button"
              @click="toggleColumnSelector"
              v-tooltip.top="{ value: 'Available Columns', showDelay: 200 }"
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
                :options="[{ label: 'Available Columns', items: columns }]"
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
            class="flex items-center gap-2 justify-end"
            v-if="!rowData.isFolder && !rowData.isParentNav"
          >
            <div
              v-if="showLastModified"
              :data-testid="`list-table-block__column__lastModify__row`"
              class="cursor-pointer"
              @click.stop="toggleLastModifiedDisplay"
            >
              <div
                v-if="!lastModifiedToggled"
                v-html="rowData.lastModify || rowData.lastModified"
                v-tooltip.top="{ value: rowData.lastModified, showDelay: 300 }"
              />
              <div
                v-else
                v-html="rowData.lastModified"
                v-tooltip.top="{
                  value: rowData.lastModify || rowData.lastModified,
                  showDelay: 300
                }"
              />
            </div>
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
      :disabled="disabledList"
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
                :disabled="disabledList"
                @click="navigateToAddPage"
                icon="pi pi-plus"
                size="small"
                :label="addButtonLabel"
                v-if="addButtonLabel"
                data-testid="data-table-skeleton-add-button"
              />
            </slot>
          </div>
        </slot>
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
    <div
      :style="{
        position: 'fixed',
        top: cellQuickActions.posY + 'px',
        left: cellQuickActions.posX + 'px',
        zIndex: 9999
      }"
      class="popup-container"
      @mouseenter="onPopupMouseEnter"
      @mouseleave="onPopupMouseLeave"
      :class="{
        visible: !cellQuickActions.rowData?.isFolder && cellQuickActions.visible
      }"
    >
      <button
        v-for="item in quickActions"
        :key="item"
        @click="item.action(cellQuickActions.rowData)"
        :title="item.title"
        class="px-2"
      >
        <i :class="item.icon"></i>
      </button>
    </div>
  </div>
</template>
<script setup>
  import { FilterMatchMode } from 'primevue/api'
  import PrimeButton from 'primevue/button'
  import Checkbox from 'primevue/checkbox'
  import Column from 'primevue/column'
  import DataTable from 'primevue/datatable'
  import InputText from 'primevue/inputtext'
  import Listbox from 'primevue/listbox'
  import PrimeMenu from 'primevue/menu'
  import OverlayPanel from 'primevue/overlaypanel'
  import Skeleton from 'primevue/skeleton'
  import { computed, onMounted, ref, watch, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import { useDialog } from 'primevue/usedialog'
  import { useToast } from 'primevue/usetoast'
  import { useTableDefinitionsStore } from '@/stores/table-definitions'
  import { getFileIcon } from '@/utils/icons'

  defineOptions({ name: 'list-table-block-new' })

  const emit = defineEmits([
    'on-load-data',
    'on-before-go-to-add-page',
    'on-before-go-to-edit',
    'update:selectedItensData',
    'on-row-click-edit-folder',
    'delete-selected-items'
  ])

  const props = defineProps({
    disabledList: {
      type: Boolean
    },
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
    listService: {
      required: true,
      type: Function
    },
    addButtonLabel: {
      type: String,
      default: () => ''
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
    selectedItensData: {
      type: Array,
      default: () => []
    },
    pt: {
      type: Object,
      default: () => ({})
    },
    paginator: {
      type: Boolean,
      default: true
    },
    enableEditClickFolder: {
      type: Boolean,
      default: false
    },
    selectedBucket: {
      type: Object,
      default: () => ({})
    },
    isDownloading: {
      type: Boolean,
      default: false
    },
    searchFilter: {
      type: String,
      default: () => ''
    },
    showLastModified: {
      type: Boolean,
      default: false
    },
    celllQuickActionsItens: {
      type: Array,
      default: () => []
    }
  })

  const tableDefinitions = useTableDefinitionsStore()

  const minimumOfItemsPerPage = ref(tableDefinitions.getNumberOfLinesPerPage)
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
  const toast = useToast()

  const lastModifiedToggled = ref(false)
  const hoverTimeout = ref(null)
  const hideTimeout = ref(null)
  const activeCellElement = ref(null)
  const pendingCellElement = ref(null)
  const cellQuickActions = ref({
    visible: false,
    text: '',
    posX: 0,
    posY: 0,
    rowData: null
  })

  const { openDeleteDialog } = useDeleteDialog()
  const dialog = useDialog()
  const router = useRouter()

  const selectedItems = computed({
    get: () => {
      return props.selectedItensData
    },
    set: (value) => {
      emit('update:selectedItensData', value)
    }
  })

  const parsedDatatablePt = computed(() => ({
    ...props.pt,
    rowCheckbox: { 'data-testid': 'data-table-row-checkbox' }
  }))

  const filterData = computed(() => {
    return data.value.filter((item) => {
      return item.name.toLowerCase().includes(props.searchFilter.toLowerCase())
    })
  })

  const handleExportTableDataToCSV = () => {
    dataTableRef.value.exportCSV()
  }
  const toggleColumnSelector = (event) => {
    columnSelectorPanel.value.toggle(event)
  }

  const reload = (query = {}) => {
    loadData({ page: 1, ...query })
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
              openDeleteDialog({
                title: action.title,
                id: rowData.id,
                data: rowData,
                deleteService: action.service,
                deleteConfirmationText: undefined,
                closeCallback: (opt) => {
                  if (opt.data.updated) {
                    reload()
                  }
                }
              })
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

  const loadData = async () => {
    if (props.listService) {
      try {
        isLoading.value = true
        data.value = await props.listService()
      } catch (error) {
        data.value = []
        const errorMessage = error.message || error
        toast.add({
          closable: true,
          severity: 'error',
          summary: 'Error',
          detail: errorMessage
        })
      } finally {
        isLoading.value = false
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

  const editItemSelected = (item) => {
    emit('on-before-go-to-edit', item)

    if (props.editInDrawer) {
      props.editInDrawer(item)
    } else if (props.enableEditClickFolder) {
      emit('on-row-click-edit-folder', item)
    }
  }

  const toggleRowSelection = (rowData) => {
    const isSelected = selectedItems.value.includes(rowData)
    if (isSelected) {
      selectedItems.value = selectedItems.value.filter((item) => item !== rowData)
    } else {
      selectedItems.value = [...selectedItems.value, rowData]
    }
  }

  const toggleSelectAll = () => {
    const selectableRows = filterData.value.filter((row) => !row.isFolder)
    if (isAllSelected.value) {
      selectedItems.value = []
    } else {
      selectedItems.value = [...selectableRows]
    }
  }

  const isAllSelected = computed(() => {
    const selectableRows = filterData.value.filter((row) => !row.isFolder)
    return (
      selectableRows.length > 0 && selectableRows.every((row) => selectedItems.value.includes(row))
    )
  })

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

  const stateClassRules = (row) => {
    if (selectedItems.value.find((item) => item.id === row.id)) {
      return 'bg-[var(--table-body-row-hover-bg)] bg-altered'
    }
    return ''
  }

  defineExpose({ reload, data, handleExportTableDataToCSV })

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
    minimumOfItemsPerPage.value = numberOfLinesPerPage
  }

  const filterBy = computed(() => {
    const filtersPath = props.columns.filter((el) => el.filterPath).map((el) => el.filterPath)
    const filters = props.columns.map((item) => item.field)

    return [...filters, ...filtersPath]
  })

  const loadLastModifiedToggleState = () => {
    const saved = localStorage.getItem('lastModifiedToggled')
    if (saved !== null) {
      lastModifiedToggled.value = JSON.parse(saved)
    }
  }

  const saveLastModifiedToggleState = () => {
    localStorage.setItem('lastModifiedToggled', JSON.stringify(lastModifiedToggled.value))
  }

  const toggleLastModifiedDisplay = () => {
    lastModifiedToggled.value = !lastModifiedToggled.value
    saveLastModifiedToggleState()
  }

  const setupCellEventHandlers = () => {
    setTimeout(() => {
      const columnsWithQuickActions = props.columns
        .map((col, index) => ({ ...col, index }))
        .filter((col) => col.quickActions === true)

      if (columnsWithQuickActions.length === 0) {
        return
      }

      let rows = document.querySelectorAll('.table-with-orange-borders .p-datatable-tbody tr')
      if (rows.length === 0) {
        rows = document.querySelectorAll('[data-testid="data-table"] tbody tr')
      }
      if (rows.length === 0) {
        rows = document.querySelectorAll('.p-datatable-tbody tr')
      }
      if (rows.length === 0) {
        rows = document.querySelectorAll('table tbody tr')
      }

      rows.forEach((row, rowIndex) => {
        columnsWithQuickActions.forEach((column) => {
          const cell = row.children[column.index + 1]
          if (cell && !cell.classList.contains('p-frozen-column')) {
            cell.addEventListener('mouseenter', onCellMouseEnter)
            cell.addEventListener('mouseleave', onCellMouseLeave)
            cell.setAttribute('data-quick-actions', 'true')
            cell.setAttribute('data-row-index', rowIndex)
          }
        })
      })
    }, 500)
  }

  const onScroll = () => {
    if (cellQuickActions.value.visible) {
      cellQuickActions.value.visible = false

      if (activeCellElement.value) {
        activeCellElement.value.classList.remove('cell-active-hover')
        activeCellElement.value = null
      }

      if (hoverTimeout.value) {
        clearTimeout(hoverTimeout.value)
        hoverTimeout.value = null
      }

      if (hideTimeout.value) {
        clearTimeout(hideTimeout.value)
      }

      pendingCellElement.value = null
    }
  }

  const onCellMouseEnter = (event) => {
    if (hoverTimeout.value) {
      clearTimeout(hoverTimeout.value)
    }
    if (hideTimeout.value) {
      clearTimeout(hideTimeout.value)
    }

    const cellElement = event.currentTarget

    if (cellElement.classList.contains('p-frozen-column')) {
      return
    }

    // Clear any existing active cell and popup
    if (activeCellElement.value) {
      activeCellElement.value.classList.remove('cell-active-hover')
    }
    cellQuickActions.value.visible = false

    pendingCellElement.value = cellElement

    hoverTimeout.value = setTimeout(() => {
      if (pendingCellElement.value === cellElement) {
        activeCellElement.value = cellElement

        const rect = cellElement.getBoundingClientRect()
        const cellText = cellElement.textContent?.trim() || 'N/A'
        const rowIndex = parseInt(cellElement.getAttribute('data-row-index') || '0')
        const currentRowData = data.value[rowIndex] || null

        cellQuickActions.value = {
          visible: true,
          text: cellText,
          posX: rect.left,
          posY: rect.top - 28,
          rowData: currentRowData
        }

        cellElement.classList.add('cell-active-hover')
      }
    }, 1000)
  }

  const onCellMouseLeave = () => {
    if (hoverTimeout.value) {
      clearTimeout(hoverTimeout.value)
      hoverTimeout.value = null
    }

    pendingCellElement.value = null

    hideTimeout.value = setTimeout(() => {
      cellQuickActions.value.visible = false

      if (activeCellElement.value) {
        activeCellElement.value.classList.remove('cell-active-hover')
        activeCellElement.value = null
      }
    }, 150)
  }

  const onPopupMouseEnter = () => {
    if (hideTimeout.value) {
      clearTimeout(hideTimeout.value)
    }

    if (activeCellElement.value) {
      activeCellElement.value.classList.add('cell-active-hover')
    }
  }

  const onPopupMouseLeave = () => {
    cellQuickActions.value.visible = false

    if (activeCellElement.value) {
      activeCellElement.value.classList.remove('cell-active-hover')
      activeCellElement.value = null
    }
  }
  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(cellQuickActions.value.text)
      .then(() => {
        toast.add({
          severity: 'success',
          summary: 'Copied',
          detail: 'Text copied to clipboard',
          life: 3000
        })
        cellQuickActions.value.visible = false
      })
      .catch(() => {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to copy text',
          life: 3000
        })
      })
  }

  const quickActions = [
    {
      title: 'Copy to clipboard',
      icon: 'pi pi-copy',
      action: copyToClipboard
    },
    ...(props.cellQuickActionsItens || [])
  ]
  watch(
    () => data.value,
    (newData) => {
      if (newData && newData.length > 0) {
        setupCellEventHandlers()
      }
    },
    { deep: true }
  )

  watch(data, (currentState) => {
    const hasData = currentState?.length > 0
    emit('on-load-data', !!hasData)
  })

  onMounted(() => {
    if (!props.lazyLoad) {
      loadData({ page: 1 })
    }
    selectedColumns.value = props.columns
    loadLastModifiedToggleState()

    window.addEventListener('scroll', onScroll, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
  })
</script>

<style scoped lang="scss">
  .table-with-orange-borders :deep(.p-datatable-tbody > tr > td) {
    transition: color 0.2s ease;
  }

  .table-with-orange-borders.outline-visible
    :deep(.p-datatable-tbody > tr > td:hover:not(.p-frozen-column)),
  .table-with-orange-borders.outline-visible :deep(.p-datatable-tbody > tr > td.cell-active-hover) {
    outline: 2px dashed #f97316 !important;
    outline-offset: -2px;
    transition-delay: 0.3s;
    border-radius: 0 6px 6px 6px;
  }
  .popup-container {
    background-color: #f97316;
    color: white;
    padding: 4px;
    border-radius: 6px 6px 0 0;
    display: flex;
    align-items: center;
    gap: 2px;
    pointer-events: auto;
    transform-origin: bottom;
    transform: scaleY(0);
    opacity: 0;
    height: 30px;
    transition:
      transform 0.3s ease,
      opacity 0.2s ease;
    &.visible {
      opacity: 1;
      transform: scaleY(1);
    }
  }

  /* Paginator styling */
  :deep(.p-paginator) {
    height: 48px;
    padding: 8px 12px;
    font-size: 12px;
    line-height: 21px;
  }

  :deep(.p-paginator .p-paginator-current) {
    margin: 0;
  }

  /* Paginator buttons styling */
  :deep(.p-paginator .p-paginator-first),
  :deep(.p-paginator .p-paginator-prev),
  :deep(.p-paginator .p-paginator-next),
  :deep(.p-paginator .p-paginator-last),
  :deep(.p-paginator .p-paginator-page) {
    width: 24px;
    height: 24px;
    font-size: 14px;
    line-height: 21px;
    margin: 0;
  }

  :deep(.p-paginator .p-dropdown) {
    width: 61px;
    height: 32px;
    font-size: 12px;
    line-height: 21px;
    .p-dropdown-label {
      width: fit-content;
    }
    .p-dropdown-trigger {
      width: 16px;
      padding-right: 6px;
    }
  }
  :deep(.p-paginator-page-input .p-inputtext) {
    width: fit-content;
    height: 32px;
    font-size: 12px;
    line-height: 21px;
    text-align: center;
  }
</style>
