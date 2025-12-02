<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock :pageTitle="selectedBucket?.name ? selectedBucket.name : 'Object Storage'">
        <template
          #default
          v-if="!selectedBucket"
        >
          <DataTableActionsButtons
            size="small"
            label="Bucket"
            @click="handleCreateBucketTrackEvent"
            createPagePath="/object-storage/create"
            data-testid="create_Bucket_button"
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
              class="flex justify-between items-start mb-4 pt-1 relative"
              ref="headerContainer"
            >
              <div
                v-if="isGreaterThanMD"
                class="flex-shrink min-w-0 overflow-hidden"
              >
                <Breadcrumb
                  :model="displayedBreadcrumbItems"
                  class="text-color-primary overflow-hidden"
                  :pt="{
                    root: { class: 'overflow-hidden' },
                    menu: { class: 'flex flex-nowrap overflow-hidden max-w-full' }
                  }"
                >
                  <template #item="{ item }">
                    <a
                      class="cursor-pointer whitespace-nowrap"
                      @click="item.label === '...' ? null : handleBreadcrumbClick(item)"
                      @mouseenter.stop="item.label === '...' && setEllipsisPopup(true)"
                      @mouseleave.stop="item.label === '...' && scheduleHidePopup()"
                    >
                      {{ item.label }}
                    </a>
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
                    class="px-3 py-2 hover:bg-[var(--surface-hover)] rounded-md cursor-pointer text-sm whitespace-nowrap"
                    @click="handleBreadcrumbClick(hiddenItem)"
                  >
                    {{ hiddenItem.label }}
                  </div>
                </div>
              </div>
              <div
                class="flex w-full md:w-auto items-center gap-2.5"
                ref="buttonsContainer"
              >
                <div class="p-input-icon-left w-full md:w-64">
                  <i class="pi pi-search" />
                  <InputText
                    v-model="fileSearchTerm"
                    placeholder="Search in folder"
                    class="w-full"
                    @input="handleFileSearch"
                  />
                </div>
                <template v-if="isGreaterThanMD">
                  <PrimeButton
                    icon="pi pi-refresh"
                    size="small"
                    outlined
                    :label="isGreaterThanXL ? 'Refresh' : ''"
                    class="px-4 py-1 flex items-center justify-center"
                    @click="handleRefresh"
                  />
                  <PrimeButton
                    icon="pi pi-cog"
                    size="small"
                    @click="handleSettingsTrackEvent"
                    :label="isGreaterThanXL ? 'Settings' : ''"
                    outlined
                    class="px-4 py-1 flex items-center justify-center"
                  />
                  <PrimeButton
                    icon="pi pi-folder-plus"
                    size="small"
                    @click="handleNewFolder"
                    :label="isGreaterThanXL ? 'New Folder' : ''"
                    outlined
                    class="px-4 py-1 flex items-center justify-center"
                  />
                </template>
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
              <ListTableBlock
                pageTitleDelete="Files"
                :listService="listEdgeStorageBucketFiles"
                ref="listServiceFilesRef"
                :columns="getColumns"
                :selected-bucket="selectedBucket"
                v-model:selectedItensData="selectedFiles"
                hiddenHeader
                paginator
                enableEditClickFolder
                :actions="fileActions"
                :isDownloading="isDownloading"
                :searchFilter="fileSearchTerm"
                :isPaginationLoading="isPaginationLoading"
                :currentPage="currentPage"
                :isCreatingNewFolder="isCreatingNewFolder"
                :newFolderName="newFolderName"
                @on-row-click-edit-folder="handleEditFolder"
                @delete-selected-items="handleDeleteSelectedItems"
                @dragover.prevent="handleDrag(true)"
                @dragleave="handleDrag(false)"
                @download-selected-items="handleDownload(selectedFiles)"
                @page="handlePaginationChange"
                @save-new-folder="handleSaveNewFolder"
                @cancel-new-folder="handleCancelNewFolder"
                @update:newFolderName="newFolderName = $event"
                class="w-full"
              />

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
  import ListTableBlock from '@/templates/list-table-block/folder-list.vue'
  import BucketListTable from './components/BucketListTable.vue'
  import PrimeButton from 'primevue/button'
  import SplitButton from 'primevue/splitbutton'
  import InputText from 'primevue/inputtext'
  import Breadcrumb from 'primevue/breadcrumb'
  import DragAndDrop from './components/DragAndDrop.vue'
  import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useResize } from '@/composables/useResize'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import { edgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'
  import ProgressCard from './components/ProgressCard.vue'
  import { DataTableActionsButtons } from '@/components/DataTable'

  const tracker = inject('tracker')
  const router = useRouter()
  const route = useRoute()
  const breadcrumbs = useBreadcrumbs()
  const {
    buckets,
    selectedBucket,
    deleteMultipleFiles,
    uploadFiles,
    filesTableNeedRefresh,
    handleDownload,
    selectedFiles,
    isDownloading,
    showDragAndDrop,
    folderPath,
    isProcessing
  } = useEdgeStorage()
  const { isGreaterThanMD, isGreaterThanXL } = useResize()
  const { openDeleteDialog } = useDeleteDialog()

  const fileActions = [
    {
      label: 'Download',
      icon: 'pi pi-download',
      type: 'action',
      commandAction: (item) => handleDownload(item)
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
    {
      field: 'name',
      header: 'Name'
    },
    {
      field: 'size',
      header: 'Size'
    }
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
  const listServiceFilesRef = ref(null)
  const isDragOver = ref(false)
  const isPaginationLoading = ref(false)
  const headerContainer = ref(null)
  const buttonsContainer = ref(null)
  const containerWidth = ref(0)
  const showEllipsisPopup = ref(false)
  const hidePopupTimeout = ref(null)
  const currentPage = ref(1)
  const isCreatingNewFolder = ref(false)
  const newFolderName = ref('')

  const breadcrumbItems = computed(() => {
    if (!selectedBucket.value) return []

    const items = [
      {
        label: selectedBucket.value.name,
        index: 0
      }
    ]

    if (folderPath.value) {
      const folders = folderPath.value.split('/').filter((folder) => folder.trim() !== '')
      folders.forEach((folder, index) => {
        items.push({
          label: folder,
          index: index + 1
        })
      })
    }

    return items
  })

  const availableWidth = computed(() => {
    if (!isGreaterThanMD.value || containerWidth.value === 0) {
      return 1000
    }

    const buttonsWidth = buttonsContainer.value ? buttonsContainer.value.offsetWidth : 400
    const gap = 16
    return Math.max(200, containerWidth.value - buttonsWidth - gap)
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

  const needFetchToAPI = computed(() => {
    return selectedBucket.value && (!selectedBucket.value.files || filesTableNeedRefresh.value)
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

  const selectBucket = (bucket) => {
    showDragAndDrop.value = false
    selectedBucket.value = bucket
    if (!route.query?.folderPath) {
      folderPath.value = ''
    }
    currentPage.value = 1
    selectedFiles.value = []
    listServiceFilesRef.value?.reload()
  }

  const handleBreadcrumbClick = (item) => {
    if (item.index === 0) {
      folderPath.value = ''
    } else {
      const folders = folderPath.value.split('/').filter((folder) => folder.trim() !== '')
      const pathToFolder = folders.slice(0, item.index).join('/')
      folderPath.value = `${pathToFolder}/`
    }
    selectedBucket.value.continuation_token = null
    currentPage.value = 1
    router.replace({ query: folderPath.value ? { folderPath: folderPath.value } : {} })
    filesTableNeedRefresh.value = true
    listServiceFilesRef.value?.reload()
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
    listServiceFilesRef.value?.reload()
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
        listServiceFilesRef.value?.reload()
      }
      document.body.removeChild(input)
    }

    document.body.appendChild(input)
    input.click()
  }

  const handleEditFolder = async (item) => {
    if (item.isParentNav) {
      goBackToBucket()
    } else if (item.isFolder) {
      folderPath.value += item.name
      router.replace({ query: folderPath.value ? { folderPath: folderPath.value } : {} })
      filesTableNeedRefresh.value = true
      await listServiceFilesRef.value?.reload()
      currentPage.value = 1
    }
  }

  const goBackToBucket = async () => {
    const pathSegments = folderPath.value.split('/').filter((segment) => segment !== '')
    pathSegments.pop()
    folderPath.value = pathSegments.length > 0 ? pathSegments.join('/') + '/' : ''
    selectedBucket.value.continuation_token = null
    router.replace({ query: folderPath.value ? { folderPath: folderPath.value } : {} })
    filesTableNeedRefresh.value = true
    await listServiceFilesRef.value?.reload()
    currentPage.value = 1
  }
  const handleMultipleDelete = () => {
    Promise.resolve().then(async () => {
      await deleteMultipleFiles(selectedFiles.value.map((file) => file.name))
      filesTableNeedRefresh.value = true
      await listServiceFilesRef.value?.reload()
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

  const listEdgeStorageBucketFiles = async () => {
    if (needFetchToAPI.value) {
      const { files, continuation_token } = await edgeStorageService.listEdgeStorageBucketFiles(
        selectedBucket.value.name,
        false,
        folderPath.value,
        selectedBucket.value.continuation_token
      )
      selectedBucket.value.continuation_token = continuation_token
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
        await listServiceFilesRef.value?.loadData()
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
      listServiceFilesRef.value?.reload()
    }
  }

  const updateContainerWidth = () => {
    if (headerContainer.value) {
      containerWidth.value = headerContainer.value.offsetWidth
    }
  }

  const handleRefresh = () => {
    filesTableNeedRefresh.value = true
    listServiceFilesRef.value?.reload()
  }

  const handleDeleteFile = async (item) => {
    await edgeStorageService.deleteEdgeStorageBucketFiles(selectedBucket.value.name, item)
    filesTableNeedRefresh.value = true
    listServiceFilesRef.value?.reload()
  }

  const handleNewFolder = () => {
    isCreatingNewFolder.value = true
    newFolderName.value = ''
  }

  const handleSaveNewFolder = () => {
    const folderName = newFolderName.value.trim()
    if (folderName) {
      const specialCharRegex = /[^\u0020-\u007F]/g
      if (specialCharRegex.test(folderName)) {
        return
      }
      const newPath = folderPath.value + folderName + '/'
      folderPath.value = newPath
      router.replace({ query: { folderPath: newPath } })
      if (!isPaginationLoading.value) {
        currentPage.value = 1
      }
      filesTableNeedRefresh.value = true
      listServiceFilesRef.value?.reload()
    }
    isCreatingNewFolder.value = false
    newFolderName.value = ''
  }

  const handleCancelNewFolder = () => {
    isCreatingNewFolder.value = false
    newFolderName.value = ''
  }

  const handleRouteChange = () => {
    const newId = route.params.id

    if (!newId) {
      selectBucket(null)
    } else {
      const bucket = buckets.value.find((bucket) => bucket.name === newId)
      selectBucket(bucket)

      if (route.query?.folderPath) {
        folderPath.value = route.query.folderPath
      }
    }
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route)
  }

  watch(
    () => route.fullPath,
    () => {
      handleRouteChange()
    },
    { immediate: true }
  )

  watch(
    () => route.params.id,
    () => {
      handleRouteChange()
    }
  )

  watch(
    breadcrumbItems,
    () => {
      setTimeout(updateContainerWidth, 50)
    },
    { deep: true }
  )

  watch(isGreaterThanMD, () => {
    setTimeout(updateContainerWidth, 50)
  })

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

    setTimeout(updateContainerWidth, 100)

    window.addEventListener('resize', updateContainerWidth)
    setupDocumentDragEvents()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateContainerWidth)
    removeDocumentDragEvents()
    folderPath.value = ''
    selectedFiles.value = []
  })
</script>
