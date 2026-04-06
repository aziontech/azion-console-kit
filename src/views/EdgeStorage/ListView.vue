<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="selectedBucket?.name ? selectedBucket.name : 'Object Storage'"
        :description="
          !selectedBucket?.name
            ? 'Define and manage buckets that store and serve object data.'
            : 'Browse, upload, and manage objects stored in this bucket.'
        "
      >
        <template #default>
          <DataTable.ActionsButtons
            v-if="!selectedBucket"
            size="small"
            label="Bucket"
            @click="handleCreateBucketTrackEvent"
            createPagePath="/object-storage/create"
            data-testid="create_Bucket_button"
          />
          <PrimeButton
            v-else
            icon="pi pi-cog"
            size="small"
            @click="handleSettingsTrackEvent"
            :label="isGreaterThanMD ? 'Settings' : ''"
            outlined
            class="px-4 py-1 flex items-center justify-center"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <BucketListTable v-if="!selectedBucket" />
      <div
        v-else
        class="flex w-full"
      >
        <div class="flex w-full flex-col gap-4 md:gap-8 overflow-auto">
          <div
            v-if="selectedBucket"
            class="flex flex-col"
          >
            <div
              class="hidden"
              ref="headerContainer"
            >
              <div ref="buttonsContainer"></div>
            </div>
            <ProgressCard />

            <DragAndDrop
              v-if="showDragAndDrop"
              :selectedBucket="selectedBucket"
              @reload="handleRefresh"
            />
            <div
              v-else
              class="flex flex-col gap-3 items-center border-1 border-transparent justify-center w-full"
              :class="{ 'border-dashed border-[#f3652b] rounded-md pb-4': isDragOver }"
            >
              <!-- Inlined folder-list.vue DataTable -->
              <div
                class="max-w-full w-full"
                data-testid="data-table-container"
                @dragover.prevent="handleDrag(true)"
                @dragleave="handleDrag(false)"
              >
                <DataTable
                  ref="dataTableRef"
                  :data="filterData"
                  :loading="isFileListLoading"
                  :paginator="true"
                  :rowsPerPageOptions="[10, 20, 50, 100]"
                  :rows="minimumOfItemsPerPage"
                  :first="firstItem"
                  :totalRecords="totalRecords"
                  :globalFilterFields="folderFilterBy"
                  :rowClass="stateClassRules"
                  :pt="parsedDatatablePt"
                  :columns="folderSelectedColumns"
                  emptyListMessage="No registers found."
                  @page="handlePaginationChange"
                  v-model:selection="selectedItems"
                  notShowEmptyBlock
                  :export-filename="getExportFileName"
                  dataKey="key"
                  isSelectable
                >
                  <template #header>
                    <div class="flex flex-col gap-2 w-full">
                      <DataTable.Header showDivider>
                        <template #first-line>
                          <div class="flex justify-between gap-2 w-full">
                            <div class="flex gap-2 w-full">
                              <DataTable.Search
                                v-model="fileSearchTerm"
                                placeholder="Search in folder"
                                @input="handleFileSearch"
                              />
                            </div>
                            <div class="flex gap-2">
                              <PrimeButton
                                outlined
                                icon="pi pi-refresh"
                                v-tooltip.top="{ value: 'Reload', showDelay: 200 }"
                                size="small"
                                @click="handleRefresh"
                                data-testid="data-table-actions-column-header-refresh"
                              />
                              <DataTable.Export @export="handleExportTableDataToCSV()" />
                              <DataTableColumnSelector
                                :columns="getColumns"
                                v-model:selectedColumns="folderSelectedColumns"
                              />
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
                                      @click="
                                        item.label === '...' ? null : handleBreadcrumbClick(item)
                                      "
                                      @mouseenter.stop="
                                        item.label === '...' && setEllipsisPopup(true)
                                      "
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
                                  'opacity-100 transition-opacity duration-300 z-[50]':
                                    showEllipsisPopup
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
                              <SplitButton
                                size="small"
                                label="Add to files"
                                @click="openFileSelector"
                                :model="uploadMenuItems"
                                primary
                                class="whitespace-nowrap"
                                :disabled="isProcessing"
                                :menuButtonProps="{
                                  class: 'rounded-l-none',
                                  style: { color: 'var(--primary-text-color) !important' }
                                }"
                                :pt="{
                                  root: { class: 'h-[2rem]' }
                                }"
                              />
                            </div>
                          </div>
                        </template>
                      </DataTable.Header>
                    </div>
                  </template>
                  <DataTable.Column headerStyle="width: 3rem">
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
                        @click.stop="!rowData.isSkeletonRow && toggleRowSelection(rowData)"
                        data-testid="data-table-row-checkbox"
                      >
                        <Skeleton
                          v-if="rowData.isSkeletonRow"
                          width="1.5rem"
                          height="1.5rem"
                        />
                        <Checkbox
                          v-else-if="
                            selectedItems.some((i) => i.name === rowData.name) &&
                            !rowData.isNewFolder
                          "
                          :model-value="selectedItems.some((i) => i.name === rowData.name)"
                          binary
                          class="pointer-events-none"
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
                    v-for="(col, index) of folderSelectedColumns"
                    :key="col.field"
                    :field="col.field"
                    :header="selectedItems.length === 0 ? col.header : ''"
                    :sortField="selectedItems.length > 0 ? null : col?.sortField"
                    headerClass="relative w-[20rem] overflow-visible"
                    class="hover:cursor-pointer"
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
                            @click="handleDownload(selectedFiles)"
                          />
                          <PrimeButton
                            size="small"
                            outlined
                            icon="pi pi-arrow-right-arrow-left"
                            label="Move"
                            class="px-4"
                            @click="handleMoveSelectedItems"
                          />
                          <PrimeButton
                            size="small"
                            icon="pi pi-trash"
                            label="Delete"
                            severity="danger"
                            class="px-4"
                            @click="handleDeleteSelectedItems"
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
                        <div class="flex items-center gap-2">
                          <InputText
                            :value="newFolderName"
                            @input="newFolderName = $event.target.value"
                            @keyup.enter="handleSaveNewFolder"
                            @keyup.escape="handleCancelNewFolder"
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
                            @click="handleSaveNewFolder"
                            :disabled="!newFolderName.trim() || hasInvalidChars"
                          />
                          <PrimeButton
                            icon="pi pi-times"
                            size="small"
                            outlined
                            @click="handleCancelNewFolder"
                          />
                        </div>
                      </template>
                      <template
                        v-else-if="
                          col.field === 'name' && renamingItem && rowData.id === renamingItem.id
                        "
                      >
                        <div class="flex items-center gap-2">
                          <InputText
                            :value="renameValue"
                            @input="renameValue = $event.target.value"
                            @keyup.enter="!isRenaming && handleSaveRename()"
                            @keyup.escape="!isRenaming && handleCancelRename()"
                            placeholder="Enter new name"
                            class="flex-1"
                            :disabled="isRenaming"
                            autofocus
                            size="small"
                          />
                          <PrimeButton
                            :icon="isRenaming ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
                            size="small"
                            outlined
                            @click="handleSaveRename"
                            :disabled="
                              isRenaming || !renameValue.trim() || renameValue === renamingItem.name
                            "
                          />
                          <PrimeButton
                            icon="pi pi-times"
                            size="small"
                            outlined
                            :disabled="isRenaming"
                            @click="handleCancelRename"
                          />
                        </div>
                      </template>
                      <template v-else-if="col.type !== 'component'">
                        <div
                          @click="!rowData.isSkeletonRow && editItemSelected(rowData)"
                          :data-testid="`list-table-block__column__${col.field}__row`"
                        >
                          {{ rowData[col.field] }}
                        </div>
                      </template>
                      <template v-else>
                        <component
                          @click="!rowData.isSkeletonRow && editItemSelected(rowData)"
                          :is="col.component(rowData[col.field])"
                          :data-testid="`list-table-block__column__${col.field}__row`"
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
                    <template #body="{ data: rowData }">
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
                          :actions="folderActionOptions(rowData)"
                          :menuRefSetter="setMenuRefForRow"
                          :onMenuToggle="toggleActionsMenu"
                        />
                      </div>
                    </template>
                  </DataTable.Column>

                  <template #empty>
                    <div class="my-4 flex flex-col gap-3 justify-center items-start">
                      <p
                        class="text-md font-normal text-secondary"
                        data-testid="list-table-block__empty-message__text"
                      >
                        No registers found.
                      </p>
                    </div>
                  </template>
                </DataTable>
              </div>

              <div class="flex items-center gap-3 text-center">
                <i class="pi pi-cloud-upload text-xl text-color-secondary"></i>
                <p class="text-sm text-color-secondary">
                  Drag files here to add them to your bucket or
                  <span
                    class="transition-colors"
                    :class="
                      isProcessing
                        ? 'text-color-secondary cursor-not-allowed'
                        : 'cursor-pointer text-[var(--text-color-link)] hover:underline'
                    "
                    @click="!isProcessing && openFileSelector()"
                    >choose your files</span
                  >
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </ContentBlock>
</template>

<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import BucketListTable from './components/BucketListTable.vue'
  import PrimeButton from '@aziontech/webkit/button'
  import SplitButton from '@aziontech/webkit/splitbutton'
  import Checkbox from '@aziontech/webkit/checkbox'
  import InputText from '@aziontech/webkit/inputtext'
  import Skeleton from '@aziontech/webkit/skeleton'
  import Breadcrumb from '@aziontech/webkit/breadcrumb'
  import DragAndDrop from './components/DragAndDrop.vue'
  import ProgressCard from './components/ProgressCard.vue'
  import MoveObjectDialog from './Dialog/MoveObjectDialog.vue'
  import DataTable from '@aziontech/webkit/list-data-table'
  const DataTableColumnSelector = DataTable.ColumnSelector
  import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useDialog } from '@aziontech/webkit/use-dialog'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { useResize } from '@/composables/useResize'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import { edgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'
  import { formatBytes } from '@/helpers/format-bytes'
  import { getFileIcon } from '@/utils/icons'
  import { useTableDefinitionsStore } from '@/stores/table-definitions'

  defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const tracker = inject('tracker')
  const router = useRouter()
  const route = useRoute()
  const dialog = useDialog()
  const toast = useToast()
  const breadcrumbs = useBreadcrumbs()
  const tableDefinitions = useTableDefinitionsStore()
  const {
    buckets,
    selectedBucket,
    deleteMultipleFiles,
    moveFiles,
    renameFile,
    uploadFiles,
    filesTableNeedRefresh,
    handleDownload,
    selectedFiles,
    isDownloading,
    showDragAndDrop,
    folderPath,
    isProcessing
  } = useEdgeStorage()
  const { isGreaterThanMD } = useResize()
  const { openDeleteDialog } = useDeleteDialog()

  const fileActions = [
    {
      label: 'Download',
      icon: 'pi pi-download',
      type: 'action',
      commandAction: (item) => handleDownload(item)
    },
    {
      label: 'Rename',
      icon: 'pi pi-pencil',
      type: 'action',
      commandAction: (item) => startRenaming(item)
    },
    {
      label: 'Move',
      icon: 'pi pi-arrow-right-arrow-left',
      type: 'action',
      commandAction: (item) => handleOpenMoveDialog([item])
    },
    {
      title: 'File',
      label: 'Delete',
      icon: 'pi pi-trash',
      type: 'delete',
      service: (item) => handleDeleteFile(item)
    }
  ]

  const getColumns = [
    { field: 'name', header: 'Name' },
    { field: 'size', header: 'Size' },
    { field: 'lastModified', header: 'Last Modified' }
  ]

  const uploadMenuItems = [
    {
      label: 'Upload folder',
      icon: 'pi pi-folder',
      command: () => openFileSelector('folder')
    },
    {
      label: 'Upload files',
      icon: 'pi pi-upload',
      command: () => openFileSelector('files')
    }
  ]

  const fileSearchTerm = ref('')
  const dataTableRef = ref(null)
  const isDragOver = ref(false)
  const isPaginationLoading = ref(false)
  const headerContainer = ref(null)
  const buttonsContainer = ref(null)
  const containerWidth = ref(0)
  const currentPage = ref(1)
  const isCreatingNewFolder = ref(false)
  const newFolderName = ref('')
  const renamingItem = ref(null)
  const renameValue = ref('')
  const isRenaming = ref(false)

  // --- Inlined folder-list state ---
  const minimumOfItemsPerPage = ref(tableDefinitions.getNumberOfLinesPerPage)
  const isFileListLoading = ref(false)
  const fileData = ref([])
  const folderSelectedColumns = ref([])
  const menuRef = ref({})
  const selectedId = ref(null)
  const showEllipsisPopup = ref(false)
  const hidePopupTimeout = ref(null)
  const internalFirstItem = ref(0)

  const selectedItems = computed({
    get: () => selectedFiles.value,
    set: (value) => {
      selectedFiles.value = value
    }
  })

  const parsedDatatablePt = computed(() => ({
    rowCheckbox: { 'data-testid': 'data-table-row-checkbox' }
  }))

  const firstItem = computed(() => {
    if (isPaginationLoading.value && internalFirstItem.value !== 0) {
      return internalFirstItem.value
    }
    return (currentPage.value - 1) * minimumOfItemsPerPage.value
  })

  const totalRecords = computed(() => {
    return fileData.value.length
  })

  const filterData = computed(() => {
    let filteredData = fileData.value.filter((item) => {
      return item.name.toLowerCase().includes(fileSearchTerm.value.toLowerCase())
    })

    if (isCreatingNewFolder.value) {
      const newFolderRow = {
        id: 'new-folder-temp',
        name: newFolderName.value,
        isFolder: true,
        isNewFolder: true,
        size: '-',
        last_modified: '-'
      }
      filteredData = [newFolderRow, ...filteredData]
    }

    if (isPaginationLoading.value) {
      const currentPageItemsCount = filteredData.length % minimumOfItemsPerPage.value
      const itemsInCurrentPage =
        currentPageItemsCount === 0 ? minimumOfItemsPerPage.value : currentPageItemsCount
      const skeletonRowsNeeded = minimumOfItemsPerPage.value - itemsInCurrentPage

      if (skeletonRowsNeeded > 0) {
        const skeletonRows = Array.from({ length: skeletonRowsNeeded }, (_unused, index) => ({
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

  const getExportFileName = computed(() => {
    const date = new Date()
    const formattedDate = date.toISOString().split('T')[0]
    const bucketName = selectedBucket.value?.name || 'export'
    return `${bucketName} - files - ${formattedDate}`
  })

  const handleExportTableDataToCSV = () => {
    dataTableRef.value.exportCSV()
  }

  const folderFilterBy = computed(() => {
    const filtersPath = getColumns.filter((el) => el.filterPath).map((el) => el.filterPath)
    const filters = getColumns.map((item) => item.field)
    return [...filters, ...filtersPath]
  })

  const hasInvalidChars = computed(() => {
    const specialCharRegex = /[^\u0020-\u007F]/g
    return specialCharRegex.test(newFolderName.value)
  })

  // --- Checkbox selection ---
  const toggleRowSelection = (rowData) => {
    if (rowData.isSkeletonRow || rowData.isFolder || rowData.isParentNav || rowData.isNewFolder)
      return

    const isSelected = selectedItems.value.some((item) => item.name === rowData.name)
    if (isSelected) {
      selectedItems.value = selectedItems.value.filter((item) => item.name !== rowData.name)
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
      selectableRows.length > 0 &&
      selectableRows.every((row) => selectedItems.value.some((item) => item.name === row.name))
    )
  })

  const stateClassRules = (row) => {
    if (selectedItems.value.find((item) => item.id === row.id)) {
      return 'bg-[var(--table-body-row-hover-bg)] bg-altered'
    }
    return ''
  }

  // --- Row icon ---
  const getRowIcon = (rowData) => {
    if (!rowData || !rowData.name) return 'mdi mdi-file text-gray-500'
    return getFileIcon(rowData)
  }

  // --- Actions ---
  const showActions = (rowData) => {
    return (
      !rowData.isFolder &&
      !rowData.isParentNav &&
      !rowData.isNewFolder &&
      !rowData.isSkeletonRow &&
      !(renamingItem.value && rowData.id === renamingItem.value.id)
    )
  }

  const folderActionOptions = (rowData) => {
    const createActionOption = (action) => {
      return {
        ...action,
        disabled: action.disabled && action.disabled(rowData),
        command: () => {
          switch (action.type) {
            case 'delete':
              openDeleteDialog({
                title: action.title,
                id: rowData.id,
                data: rowData,
                description:
                  typeof action.description === 'function'
                    ? action.description(rowData)
                    : action.description,
                warningMessage:
                  typeof action.warningMessage === 'function'
                    ? action.warningMessage(rowData)
                    : action.warningMessage,
                deleteService: action.service,
                deleteConfirmationText: undefined,
                closeCallback: (opt) => {
                  if (opt.data.updated) {
                    reloadFileList()
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

    return fileActions
      .filter((action) => !action.visibleAction || action.visibleAction(rowData))
      .map(createActionOption)
  }

  const toggleActionsMenu = (event, selectedID) => {
    if (!selectedID) {
      throw new Error('Please provide an id for each data item through the service adapter')
    }
    selectedId.value = selectedID
    menuRef.value[selectedID]?.toggle(event)
  }

  const setMenuRefForRow = (rowDataID) => {
    return (document) => {
      if (document !== null) {
        menuRef.value[rowDataID] = document
      }
    }
  }

  // --- Item click ---
  const editItemSelected = (item) => {
    if (item.isSkeletonRow || item.isNewFolder) return

    if (item.isParentNav) {
      goBackToBucket()
    } else if (item.isFolder) {
      const newPath = folderPath.value + item.name
      router.replace({ query: newPath ? { folderPath: newPath } : {} })
    }
  }

  // --- Breadcrumb ---
  const breadcrumbItems = computed(() => {
    if (!selectedBucket.value) return []

    const items = [
      {
        label: selectedBucket.value.name,
        index: 0,
        icon: 'pi pi-cloud'
      }
    ]

    if (folderPath.value) {
      const folders = folderPath.value.split('/').filter((folder) => folder.trim() !== '')
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
    if (containerWidth.value === 0) {
      return 1000
    }

    const bWidth = buttonsContainer.value ? buttonsContainer.value.offsetWidth : 400
    const gap = 16
    return Math.max(200, containerWidth.value - bWidth - gap)
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

  // --- Data loading ---
  const loadFileData = async () => {
    try {
      isFileListLoading.value = true
      fileData.value = await listEdgeStorageBucketFiles()
    } catch (error) {
      fileData.value = []
      const errorMessage = error.message || error
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: errorMessage
      })
    } finally {
      isFileListLoading.value = false
    }
  }

  const reloadFileList = () => {
    loadFileData()
  }

  // --- Original business logic ---
  const needFetchToAPI = computed(() => {
    return selectedBucket.value && (!selectedBucket.value.files || filesTableNeedRefresh.value)
  })

  const selectBucket = (bucket) => {
    showDragAndDrop.value = false
    selectedBucket.value = bucket
    if (!route.query?.folderPath) {
      folderPath.value = ''
    }
    currentPage.value = 1
    selectedFiles.value = []
    reloadFileList()
  }

  const handleBreadcrumbClick = (item) => {
    let newPath = ''
    if (item.index !== 0) {
      const folders = folderPath.value.split('/').filter((folder) => folder.trim() !== '')
      const pathToFolder = folders.slice(0, item.index).join('/')
      newPath = `${pathToFolder}/`
    }
    router.replace({ query: newPath ? { folderPath: newPath } : {} })
  }

  const handleCreateBucketTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Bucket'
    })
  }

  const handleSettingsTrackEvent = () => {
    router.push(`/object-storage/${selectedBucket.value.id}/edit/main-settings`)
  }

  const handleFileSearch = () => {
    reloadFileList()
  }

  const openFileSelector = (type = 'files') => {
    if (isProcessing.value) return

    const input = document.createElement('input')
    input.type = 'file'
    input.style.display = 'none'

    if (type === 'folder') {
      input.webkitdirectory = true
      input.multiple = false
    } else {
      input.multiple = true
      input.webkitdirectory = false
    }

    input.onchange = async (event) => {
      const files = event.target.files
      if (files.length) {
        filesTableNeedRefresh.value = true
        await uploadFiles(files)
        reloadFileList()
      }
      document.body.removeChild(input)
    }

    document.body.appendChild(input)
    input.click()
  }

  const goBackToBucket = () => {
    const pathSegments = folderPath.value.split('/').filter((segment) => segment !== '')
    pathSegments.pop()
    const newPath = pathSegments.length > 0 ? pathSegments.join('/') + '/' : ''
    router.replace({ query: newPath ? { folderPath: newPath } : {} })
  }

  const handleMultipleDelete = () => {
    Promise.resolve().then(async () => {
      await deleteMultipleFiles(selectedFiles.value.map((file) => file.name))
      filesTableNeedRefresh.value = true
      await reloadFileList()
      currentPage.value = 1
    })
  }

  const handleDeleteSelectedItems = () => {
    openDeleteDialog({
      title: selectedFiles.value.length > 1 ? `${selectedFiles.value.length} files` : 'File',
      message: 'Are you sure you want to delete the selected files?',
      data: {
        deleteConfirmationText:
          selectedFiles.value.length > 1 ? 'delete' : selectedFiles.value[0].name
      },
      showToast: false,
      deleteService: () => handleMultipleDelete(),
      closeCallback: () => {
        selectedFiles.value = []
      }
    })
  }

  const handleOpenMoveDialog = (files) => {
    const totalSize = files.reduce((sum, file) => sum + (file.sizeBytes || 0), 0)
    const formattedSize = totalSize > 0 ? formatBytes(totalSize) : ''

    dialog.open(MoveObjectDialog, {
      data: {
        files,
        currentFolderPath: folderPath.value,
        bucketName: selectedBucket.value.name,
        totalSize: formattedSize
      },
      onClose: async (options) => {
        if (options?.data?.updated && 'destinationPath' in (options?.data || {})) {
          const filesToMove = files.map((file) => ({
            name: file.name,
            fullPath: folderPath.value ? folderPath.value + file.name : file.name
          }))
          selectedFiles.value = []
          await moveFiles(filesToMove, options.data.destinationPath)
          filesTableNeedRefresh.value = true
          reloadFileList()
        }
      }
    })
  }

  const handleMoveSelectedItems = () => {
    handleOpenMoveDialog(selectedFiles.value)
  }

  const listEdgeStorageBucketFiles = async () => {
    if (needFetchToAPI.value) {
      const { files, continuation_token } = await edgeStorageService.listEdgeStorageBucketFiles(
        selectedBucket.value.name,
        false,
        folderPath.value,
        selectedBucket.value?.continuation_token
      )
      if (selectedBucket.value) {
        selectedBucket.value.continuation_token = continuation_token || null
        const filterFiles = files.map((file) => ({
          ...file,
          name: file.name.replace(folderPath.value, '')
        }))
        if (folderPath.value && !isPaginationLoading.value) {
          filterFiles.unshift({
            id: '..',
            name: '..',
            isParentNav: true,
            isFolder: true
          })
        }
        if (isPaginationLoading.value) {
          selectedBucket.value.files = [...selectedBucket.value.files, ...filterFiles]
        } else {
          selectedBucket.value.files = filterFiles
        }
        filesTableNeedRefresh.value = false
      }
    }

    showDragAndDrop.value = !selectedBucket.value?.files?.length
    return selectedBucket.value?.files
  }

  const handleDrag = (value) => {
    isDragOver.value = value
  }

  const handlePaginationChange = async (event) => {
    const { page, pageCount } = event
    const isLastPage = page >= pageCount - 1

    if (isPaginationLoading.value && page === 0) {
      return
    }

    currentPage.value = page + 1

    if (isLastPage && selectedBucket.value?.continuation_token && !isPaginationLoading.value) {
      try {
        isPaginationLoading.value = true
        filesTableNeedRefresh.value = true
        await loadFileData()
      } finally {
        isPaginationLoading.value = false
      }
    }
  }

  const handleDragDropUpload = async (event) => {
    isDragOver.value = false
    if (isProcessing.value) return

    const files = event.target.files || event.dataTransfer.files
    if (files.length) {
      filesTableNeedRefresh.value = true
      await uploadFiles(files)
      reloadFileList()
    }
  }

  const updateContainerWidth = () => {
    if (headerContainer.value) {
      containerWidth.value = headerContainer.value.offsetWidth
    }
  }

  const handleRefresh = () => {
    filesTableNeedRefresh.value = true
    reloadFileList()
  }

  const handleDeleteFile = async (item) => {
    await edgeStorageService.deleteEdgeStorageBucketFiles(selectedBucket.value.name, item)
    filesTableNeedRefresh.value = true
    reloadFileList()
  }

  const handleSaveNewFolder = () => {
    const folderName = newFolderName.value.trim()
    if (folderName) {
      const specialCharRegex = /[^\u0020-\u007F]/g
      if (specialCharRegex.test(folderName)) {
        return
      }
      const newPath = folderPath.value + folderName + '/'
      router.replace({ query: { folderPath: newPath } })
    }
    isCreatingNewFolder.value = false
    newFolderName.value = ''
  }

  const handleCancelNewFolder = () => {
    isCreatingNewFolder.value = false
    newFolderName.value = ''
  }

  const startRenaming = (item) => {
    renamingItem.value = item
    renameValue.value = item.name
  }

  const handleSaveRename = async () => {
    const newName = renameValue.value.trim()
    if (!newName || newName === renamingItem.value.name) {
      handleCancelRename()
      return
    }

    try {
      isRenaming.value = true
      await renameFile(renamingItem.value, newName)
      renamingItem.value = null
      renameValue.value = ''
      reloadFileList()
    } catch {
      // toast already shown by composable
    } finally {
      isRenaming.value = false
    }
  }

  const handleCancelRename = () => {
    renamingItem.value = null
    renameValue.value = ''
  }

  const handleRouteChange = () => {
    const newId = route.params.id

    if (!newId) {
      selectBucket(null)
    } else {
      if (selectedBucket.value?.name !== newId) {
        const bucket = buckets.value.find((item) => item.name === newId) || {
          name: newId,
          id: newId
        }
        selectBucket(bucket)
      } else {
        if (route.query?.folderPath) {
          folderPath.value = route.query.folderPath
        } else {
          folderPath.value = ''
        }
        if (selectedBucket.value) {
          selectedBucket.value.continuation_token = null
        }
        currentPage.value = 1
        filesTableNeedRefresh.value = true
        reloadFileList()
      }
    }
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route)
  }

  // --- Watchers ---
  watch(
    () => route.fullPath,
    () => {
      handleRouteChange()
    },
    { immediate: true }
  )

  watch(folderPath, () => {
    setTimeout(updateContainerWidth, 50)
  })

  watch(
    () => [currentPage.value, minimumOfItemsPerPage.value, isPaginationLoading.value],
    () => {
      if (!isPaginationLoading.value) {
        internalFirstItem.value = (currentPage.value - 1) * minimumOfItemsPerPage.value
      }
    }
  )

  watch(fileData, () => {
    // emit on-load-data equivalent
  })

  // --- Document drag events ---
  const handleDocumentDragOver = (event) => {
    event.preventDefault()
    handleDrag(true)
  }

  const handleDocumentDragEnter = (event) => {
    event.preventDefault()
    handleDrag(true)
  }

  const handleDocumentDrop = (event) => {
    event.preventDefault()
    handleDragDropUpload(event)
  }

  const handleDocumentDragLeave = (event) => {
    if (!event.relatedTarget || !document.contains(event.relatedTarget)) {
      handleDrag(false)
    }
  }

  const setupDocumentDragEvents = () => {
    document.addEventListener('dragover', handleDocumentDragOver)
    document.addEventListener('dragenter', handleDocumentDragEnter)
    document.addEventListener('drop', handleDocumentDrop)
    document.addEventListener('dragleave', handleDocumentDragLeave)
  }

  const removeDocumentDragEvents = () => {
    document.removeEventListener('dragover', handleDocumentDragOver)
    document.removeEventListener('dragenter', handleDocumentDragEnter)
    document.removeEventListener('drop', handleDocumentDrop)
    document.removeEventListener('dragleave', handleDocumentDragLeave)
  }

  onMounted(async () => {
    if (route.params?.id && route.query?.folderPath) {
      folderPath.value = route.query.folderPath
    }

    folderSelectedColumns.value = getColumns

    if (selectedBucket.value && !fileData.value.length) {
      await loadFileData()
    }

    setTimeout(updateContainerWidth, 100)

    window.addEventListener('resize', updateContainerWidth)
    setupDocumentDragEvents()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateContainerWidth)
    removeDocumentDragEvents()
    folderPath.value = ''
    selectedFiles.value = []
    if (hidePopupTimeout.value) {
      clearTimeout(hidePopupTimeout.value)
    }
  })
</script>

<style scoped lang="scss">
  :deep(.p-breadcrumb .p-breadcrumb-list .p-menuitem:hover) {
    text-decoration: none !important;
  }
</style>
