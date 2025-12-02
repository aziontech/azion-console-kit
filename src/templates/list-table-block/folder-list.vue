<script setup>
  import PrimeButton from 'primevue/button'
  import Checkbox from 'primevue/checkbox'
  import InputText from 'primevue/inputtext'
  import Skeleton from 'primevue/skeleton'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import { useDataTable } from '@/composables/useDataTable'
  import { useDialog } from 'primevue/usedialog'
  import { useToast } from 'primevue/usetoast'
  import { useTableDefinitionsStore } from '@/stores/table-definitions'
  import { getFileIcon } from '@/utils/icons'
  import DataTable from '@/components/DataTable'

  defineOptions({ name: 'list-table-block-new' })
  const emit = defineEmits([
    'on-load-data',
    'on-before-go-to-add-page',
    'on-before-go-to-edit',
    'update:selectedItensData',
    'on-row-click-edit-folder',
    'delete-selected-items',
    'download-selected-items',
    'page',
    'save-new-folder',
    'cancel-new-folder',
    'update:new-folder-name'
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
      default: true
    },
    isPaginationLoading: {
      type: Boolean,
      default: false
    },
    currentPage: {
      type: Number,
      default: 1
    },
    isCreatingNewFolder: {
      type: Boolean,
      default: false
    },
    newFolderName: {
      type: String,
      default: ''
    }
  })

  const tableDefinitions = useTableDefinitionsStore()

  const minimumOfItemsPerPage = ref(tableDefinitions.getNumberOfLinesPerPage)
  const isRenderActions = !!props.actions?.length
  const isRenderOneOption = props.actions?.length === 1
  const selectedId = ref(null)
  const dataTableRef = ref(null)
  const isLoading = ref(false)
  const data = ref([])
  const selectedColumns = ref([])
  const menuRef = ref({})
  const toast = useToast()

  const internalFirstItem = ref(0)

  const { openDeleteDialog } = useDeleteDialog()
  const dialog = useDialog()

  const { showPopup, popupPosition, popupData, handleMouseEnter, handleMouseLeave } = useDataTable(
    props,
    emit
  )

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

  const firstItem = computed(() => {
    if (props.isPaginationLoading && internalFirstItem.value !== 0) {
      return internalFirstItem.value
    }
    return (props.currentPage - 1) * minimumOfItemsPerPage.value
  })

  const totalRecords = computed(() => {
    return data.value.length
  })

  const filterData = computed(() => {
    let filteredData = data.value.filter((item) => {
      return item.name.toLowerCase().includes(props.searchFilter.toLowerCase())
    })

    if (props.isCreatingNewFolder) {
      const newFolderRow = {
        id: 'new-folder-temp',
        name: props.newFolderName,
        isFolder: true,
        isNewFolder: true,
        size: '-',
        last_modified: '-'
      }
      filteredData = [newFolderRow, ...filteredData]
    }

    if (props.isPaginationLoading) {
      const currentPageItemsCount = filteredData.length % minimumOfItemsPerPage.value
      const itemsInCurrentPage =
        currentPageItemsCount === 0 ? minimumOfItemsPerPage.value : currentPageItemsCount
      const skeletonRowsNeeded = minimumOfItemsPerPage.value - itemsInCurrentPage

      if (skeletonRowsNeeded > 0) {
        // eslint-disable-next-line id-length
        const skeletonRows = Array.from({ length: skeletonRowsNeeded }, (_, index) => ({
          id: `skeleton-${index}`,
          isSkeletonRow: true,
          name: '',
          size: '',
          last_modified: ''
        }))
        filteredData = [...filteredData, ...skeletonRows]
      }
    }

    return filteredData
  })

  const handleExportTableDataToCSV = () => {
    dataTableRef.value.exportCSV()
  }

  const reload = () => {
    loadData()
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

  const toggleActionsMenu = (event, selectedID) => {
    if (!selectedID) {
      throw new Error('Please provide an id for each data item through the service adapter')
    }
    selectedId.value = selectedID
    menuRef.value[selectedID].toggle(event)
  }

  const editItemSelected = (item) => {
    if (item.isSkeletonRow || item.isNewFolder) return

    emit('on-before-go-to-edit', item)

    if (props.editInDrawer) {
      props.editInDrawer(item)
    } else if (props.enableEditClickFolder) {
      emit('on-row-click-edit-folder', item)
    }
  }

  const toggleRowSelection = (rowData) => {
    if (rowData.isSkeletonRow || rowData.isFolder || rowData.isParentNav || rowData.isNewFolder)
      return

    const isSelected = selectedItems.value.includes(rowData)
    if (isSelected) {
      selectedItems.value = selectedItems.value.filter((item) => item !== rowData)
    } else {
      selectedItems.value = [...selectedItems.value, rowData]
    }
  }

  const toggleSelectAll = () => {
    const selectableRows = filterData.value.filter(
      (row) => !row.isFolder && !row.isParentNav && !row.isNewFolder && !row.isSkeletonRow
    )
    if (isAllSelected.value) {
      selectedItems.value = []
    } else {
      selectedItems.value = [...selectableRows]
    }
  }

  const isAllSelected = computed(() => {
    const selectableRows = filterData.value.filter(
      (row) => !row.isFolder && !row.isParentNav && !row.isNewFolder && !row.isSkeletonRow
    )
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

  defineExpose({ reload, loadData, data, handleExportTableDataToCSV })

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

  const hasInvalidChars = computed(() => {
    const specialCharRegex = /[^\u0020-\u007F]/g
    const isInvalid = specialCharRegex.test(props.newFolderName)
    return isInvalid
  })

  const handleFolderNameInput = (event) => {
    emit('update:newFolderName', event.target.value)
  }

  const showActions = (rowData) => {
    return (
      !rowData.isFolder && !rowData.isParentNav && !rowData.isNewFolder && !rowData.isSkeletonRow
    )
  }

  const getRowIcon = (rowData) => {
    if (!rowData || !rowData.name) return 'mdi mdi-file text-gray-500'
    return getFileIcon(rowData)
  }

  watch(
    () => [props.currentPage, minimumOfItemsPerPage.value, props.isPaginationLoading],
    () => {
      if (!props.isPaginationLoading) {
        internalFirstItem.value = (props.currentPage - 1) * minimumOfItemsPerPage.value
      }
    }
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
  })
</script>
<template>
  <div
    class="max-w-full"
    :class="{ 'mt-4': isTabs }"
    data-testid="data-table-container"
  >
    <DataTable
      ref="dataTableRef"
      :data="filterData"
      :loading="isLoading"
      :paginator="paginator"
      :rowsPerPageOptions="[10, 20, 50, 100]"
      :rows="minimumOfItemsPerPage"
      :first="firstItem"
      :totalRecords="totalRecords"
      :globalFilterFields="filterBy"
      :rowClass="stateClassRules"
      :pt="parsedDatatablePt"
      :columns="columns"
      :emptyListMessage="emptyListMessage"
      @page="emit('page', $event)"
      v-model:selection="selectedItems"
      notShowEmptyBlock
      :frozenValue="frozenRows"
      isSelectable
    >
      <DataTable.Column
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
            class="cursor-pointer flex items-center justify-center w-6 h-8"
            :class="{ 'pointer-events-none': rowData.isSkeletonRow }"
            @click="!rowData.isSkeletonRow && toggleRowSelection(rowData)"
            data-testid="data-table-row-checkbox"
          >
            <Skeleton
              v-if="rowData.isSkeletonRow"
              width="1.5rem"
              height="1.5rem"
            />
            <Checkbox
              v-else-if="selectedItems.includes(rowData) && !rowData.isNewFolder"
              :model-value="selectedItems.includes(rowData)"
              @update:model-value="toggleRowSelection(rowData)"
              @click.stop="toggleRowSelection(rowData)"
              binary
            />
            <i
              v-else
              :key="`icon-${rowData.id}-${rowData.name}`"
              class="text-xl"
              :class="getRowIcon(rowData)"
            ></i>
          </div>
        </template>
      </DataTable.Column>

      <DataTable.Column
        :sortable="selectedItems.length > 0 ? false : !col.disableSort"
        v-for="(col, index) of selectedColumns"
        :key="col.field"
        :field="col.field"
        :header="selectedItems.length === 0 ? col.header : ''"
        :sortField="selectedItems.length > 0 ? null : col?.sortField"
        headerClass="relative w-[20rem]"
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
          <template v-if="rowData.isSkeletonRow">
            <Skeleton
              width="100%"
              height="1rem"
            />
          </template>
          <template v-else-if="rowData.isNewFolder && col.field === 'name'">
            <div class="flex items-center gawp-2">
              <InputText
                :value="props.newFolderName"
                @input="handleFolderNameInput"
                @keyup.enter="emit('save-new-folder')"
                @keyup.escape="emit('cancel-new-folder')"
                placeholder="Enter folder name"
                class="flex-1"
                :class="{ 'p-invalid border-red-500': hasInvalidChars }"
                autofocus
                size="small"
              />
              <PrimeButton
                icon="pi pi-check"
                size="small"
                outlined
                @click="emit('save-new-folder')"
                :disabled="!props.newFolderName.trim() || hasInvalidChars"
              />
              <PrimeButton
                icon="pi pi-times"
                size="small"
                outlined
                @click="emit('cancel-new-folder')"
              />
            </div>
          </template>
          <template v-else-if="col.type !== 'component'">
            <div
              class="text-[12px]"
              :class="{ 'pointer-events-none': rowData.isSkeletonRow }"
              @click="!rowData.isSkeletonRow && editItemSelected(rowData)"
              v-html="rowData[col.field]"
              :data-testid="`list-table-block__column__${col.field}__row`"
            />
          </template>
          <template v-else>
            <component
              @click="!rowData.isSkeletonRow && editItemSelected(rowData)"
              :is="col.component(extractFieldValue(rowData, col.field))"
              :data-testid="`list-table-block__column__${col.field}__row`"
              class="text-[12px]"
              :class="{ 'pointer-events-none': rowData.isSkeletonRow }"
            />
          </template>
        </template>
      </DataTable.Column>

      <DataTable.Column
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
            <DataTable.ColumnSelector
              :columns="columns"
              v-model:selectedColumns="selectedColumns"
            />
          </div>
        </template>
        <template
          #body="{ data: rowData }"
          v-if="isRenderActions"
        >
          <div
            class="flex items-center gap-2 justify-end"
            v-if="rowData.isSkeletonRow"
          >
            <Skeleton
              width="1rem"
              height="2rem"
              class="mr-1"
            />
          </div>
          <div
            class="flex items-center gap-2 justify-end"
            v-else-if="showActions(rowData)"
          >
            <DataTable.LastModifiedCell
              v-if="showLastModified"
              :rowData="rowData"
              :handleMouseEnter="handleMouseEnter"
              :handleMouseLeave="handleMouseLeave"
            />
            <DataTable.RowActions
              v-if="isRenderOneOption"
              :rowData="rowData"
              :singleAction="optionsOneAction(rowData)"
              :actions="[]"
              :onActionExecute="executeCommand"
            />
            <DataTable.RowActions
              v-else
              :rowData="rowData"
              :actions="actionOptions(rowData)"
              :menuRefSetter="setMenuRefForRow"
              :onMenuToggle="toggleActionsMenu"
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
    </DataTable>

    <DataTable.LastModifiedPopup
      :visible="showPopup"
      :last-editor="popupData.lastEditor"
      :last-modified="popupData.lastModified"
      :position="popupPosition"
    />
  </div>
</template>
