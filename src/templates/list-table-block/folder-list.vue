<script setup>
  import PrimeButton from 'primevue/button'
  import Checkbox from 'primevue/checkbox'
  import InputText from 'primevue/inputtext'
  import Skeleton from 'primevue/skeleton'
  import Breadcrumb from 'primevue/breadcrumb'
  import OverlayPanel from 'primevue/overlaypanel'
  import Listbox from 'primevue/listbox'
  import { computed, onMounted, ref, watch, onUnmounted } from 'vue'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
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
    },
    folderPath: {
      type: String,
      default: ''
    },
    onBreadcrumbClick: {
      type: Function,
      default: null
    },
    onRefresh: {
      type: Function,
      default: null
    },
    headerContainer: {
      type: Object,
      default: null
    },
    buttonsContainer: {
      type: Object,
      default: null
    },
    containerWidth: {
      type: Number,
      default: 0
    }
  })

  const tableDefinitions = useTableDefinitionsStore()

  const minimumOfItemsPerPage = ref(tableDefinitions.getNumberOfLinesPerPage)
  const isRenderActions = !!props.actions?.length
  const selectedId = ref(null)
  const dataTableRef = ref(null)
  const isLoading = ref(false)
  const data = ref([])
  const selectedColumns = ref([])
  const menuRef = ref({})
  const toast = useToast()
  const columnSelectorPanel = ref(null)
  const showEllipsisPopup = ref(false)
  const hidePopupTimeout = ref(null)

  const internalFirstItem = ref(0)

  const { openDeleteDialog } = useDeleteDialog()
  const dialog = useDialog()

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

  const breadcrumbItems = computed(() => {
    if (!props.selectedBucket) return []

    const items = [
      {
        label: props.selectedBucket.name,
        index: 0,
        icon: 'pi pi-cloud'
      }
    ]

    if (props.folderPath) {
      const folders = props.folderPath.split('/').filter((folder) => folder.trim() !== '')
      folders.forEach((folder, index) => {
        items.push({
          label: folder + '/',
          index: index + 1,
          icon: 'pi pi-folder'
        })
      })
    }

    return items
  })

  const availableWidth = computed(() => {
    if (props.containerWidth === 0) {
      return 1000
    }

    const buttonsWidth = props.buttonsContainer ? props.buttonsContainer.offsetWidth : 400
    const gap = 16
    return Math.max(200, props.containerWidth - buttonsWidth - gap)
  })

  const displayedBreadcrumbItems = computed(() => {
    const items = breadcrumbItems.value
    const width = availableWidth.value

    if (items.length <= 1) {
      return items
    }

    const estimatedItemWidth = 120
    const separatorWidth = 32
    const ellipsisWidth = 40

    const calculateBreadcrumbWidth = (itemsToShow) => {
      const totalItems = itemsToShow.length
      const hasEllipsis = itemsToShow.some((item) => item.label === '...')

      let totalWidth = totalItems * estimatedItemWidth + (totalItems - 1) * separatorWidth
      if (hasEllipsis) {
        totalWidth = totalWidth - estimatedItemWidth + ellipsisWidth
      }

      return totalWidth
    }

    if (calculateBreadcrumbWidth(items) <= width) {
      return items
    }

    if (items.length === 2) {
      return items
    }

    let currentItems = [...items]

    while (currentItems.length > 2) {
      const testItems = [currentItems[0], { label: '...' }, ...currentItems.slice(2)]

      if (calculateBreadcrumbWidth(testItems) <= width) {
        return testItems
      }

      currentItems.splice(1, 1)
    }

    return [items[0], { label: '...', disabled: true }, items[items.length - 1]]
  })

  const hiddenBreadcrumbItems = computed(() => {
    const items = breadcrumbItems.value
    const displayed = displayedBreadcrumbItems.value

    const hasEllipsis = displayed.some((item) => item.label === '...')
    if (!hasEllipsis) {
      return []
    }

    const firstDisplayedIndex = displayed[0].index
    const lastDisplayedItems = displayed.slice(-2)
    const lastDisplayedIndex = lastDisplayedItems[0].index

    return items.filter(
      (item) => item.index > firstDisplayedIndex && item.index < lastDisplayedIndex
    )
  })

  const setEllipsisPopup = (value) => {
    if (!value) {
      setTimeout(() => {
        showEllipsisPopup.value = value
      }, 500)
    } else {
      showEllipsisPopup.value = value
    }
  }

  const scheduleHidePopup = () => {
    if (hidePopupTimeout.value) {
      clearTimeout(hidePopupTimeout.value)
    }
    hidePopupTimeout.value = setTimeout(() => {
      showEllipsisPopup.value = false
    }, 200)
  }

  const cancelHidePopup = () => {
    if (hidePopupTimeout.value) {
      clearTimeout(hidePopupTimeout.value)
      hidePopupTimeout.value = null
    }
    showEllipsisPopup.value = true
  }

  const handleBreadcrumbClick = (item) => {
    if (props.onBreadcrumbClick) {
      props.onBreadcrumbClick(item)
    }
  }

  const toggleColumnSelector = () => {
    columnSelectorPanel.value.toggle(event)
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

  onUnmounted(() => {
    if (hidePopupTimeout.value) {
      clearTimeout(hidePopupTimeout.value)
    }
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
      <template #header>
        <div class="flex flex-col gap-2 w-full">
          <DataTable.Header :showDivider="props.folderPath">
            <template #first-line>
              <div class="flex justify-between gap-2 w-full">
                <div class="flex gap-2 w-full">
                  <slot name="search-slot" />
                </div>
                <div class="flex gap-2">
                  <PrimeButton
                    v-if="props.onRefresh"
                    outlined
                    icon="pi pi-refresh"
                    size="small"
                    @click="props.onRefresh"
                    data-testid="data-table-actions-column-header-refresh"
                  />
                  <DataTable.Export @export="handleExportTableDataToCSV($event)" />
                  <PrimeButton
                    outlined
                    icon="ai ai-column"
                    size="small"
                    @click="toggleColumnSelector"
                    v-tooltip.top="{ value: 'Available Columns', showDelay: 200 }"
                    data-testid="data-table-actions-column-header-toggle-columns"
                  />
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
                  <slot name="header-actions" />
                </div>
              </div>
            </template>
            <template #second-line>
              <div class="flex justify-between items-center gap-2">
                <div class="relative flex-1 min-w-0">
                  <Breadcrumb
                    :model="displayedBreadcrumbItems"
                    class="text-color-primary overflow-hidden p-0 text-[12px] text-[var(--text-color-secondary)] hover:no-underline"
                    :pt="{
                      root: { class: 'overflow-hidden no-underline' },
                      menu: { class: 'flex flex-nowrap overflow-hidden max-w-full' }
                    }"
                  >
                    <template #item="{ item }">
                      <div class="flex gap-2 items-center">
                        <i
                          class="hover:no-underline"
                          :class="item.icon"
                        ></i>
                        <a
                          class="cursor-pointer whitespace-nowrap hover:no-underline"
                          @click="item.label === '...' ? null : handleBreadcrumbClick(item)"
                          @mouseenter.stop="item.label === '...' && setEllipsisPopup(true)"
                          @mouseleave.stop="item.label === '...' && scheduleHidePopup()"
                        >
                          {{ item.label }}
                        </a>
                      </div>
                    </template>
                  </Breadcrumb>
                  <div
                    class="absolute top-full left-20 mt-1 bg-[var(--menu-bg)] rounded-md z-[-50] opacity-0"
                    @mouseleave="scheduleHidePopup()"
                    @mouseenter="cancelHidePopup()"
                    :class="{
                      'opacity-100 transition-opacity duration-300 z-[50]': showEllipsisPopup
                    }"
                  >
                    <div
                      v-for="hiddenItem in hiddenBreadcrumbItems"
                      :key="hiddenItem.index"
                      class="px-3 py-2 hover:bg-[var(--surface-hover)] rounded-md cursor-pointer text-sm whitespace-nowrap text-[12px]"
                      @click="handleBreadcrumbClick(hiddenItem)"
                    >
                      {{ hiddenItem.label }}
                    </div>
                  </div>
                </div>
                <div class="flex gap-2 flex-shrink-0">
                  <slot name="second-line-actions" />
                </div>
              </div>
            </template>
          </DataTable.Header>
        </div>
      </template>
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
            <DataTable.RowActions
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
  </div>
</template>
<style scoped lang="scss">
  :deep(.p-breadcrumb .p-breadcrumb-list .p-menuitem:hover) {
    text-decoration: none !important;
  }
</style>
