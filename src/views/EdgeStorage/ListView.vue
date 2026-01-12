<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="selectedBucket?.name ? selectedBucket.name : 'Object Storage'"
        :description="
          !selectedBucket?.name
            ? 'Define and manage buckets that store and serve object data.'
            : 'Configure bucket settings and access controls parameters.'
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
            :viewDocumentationIsVisible="true"
            :documentationService="documentationService"
            :getHelpLinkIsVisible="false"
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
              <ListTableBlock
                pageTitleDelete="Files"
                :listService="listEdgeStorageBucketFiles"
                ref="listServiceFilesRef"
                :columns="getColumns"
                :selected-bucket="selectedBucket"
                v-model:selectedItensData="selectedFiles"
                paginator
                enableEditClickFolder
                :actions="fileActions"
                :isDownloading="isDownloading"
                :searchFilter="fileSearchTerm"
                :isPaginationLoading="isPaginationLoading"
                :currentPage="currentPage"
                :isCreatingNewFolder="isCreatingNewFolder"
                :newFolderName="newFolderName"
                :folderPath="folderPath"
                :onBreadcrumbClick="handleBreadcrumbClick"
                :onRefresh="handleRefresh"
                :headerContainer="headerContainer"
                :buttonsContainer="buttonsContainer"
                :containerWidth="containerWidth"
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
              >
                <template #search-slot>
                  <DataTable.Search
                    v-model="fileSearchTerm"
                    placeholder="Search in folder"
                    @input="handleFileSearch"
                  />
                </template>
                <template #second-line-actions>
                  <!-- comment button for hide to users -->
                  <!-- <PrimeButton
                    icon="pi pi-folder-plus"
                    size="small"
                    @click="handleNewFolder"
                    :label="isGreaterThanMD ? 'New Folder' : ''"
                    outlined
                    class="px-4 py-1 flex items-center justify-center"
                  /> -->
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
                </template>
              </ListTableBlock>

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
  import DragAndDrop from './components/DragAndDrop.vue'
  import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useResize } from '@/composables/useResize'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import { edgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'
  import ProgressCard from './components/ProgressCard.vue'
  import DataTable from '@/components/DataTable'

  defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

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
    },
    {
      field: 'lastModified',
      header: 'Last Modified'
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
  const currentPage = ref(1)
  const isCreatingNewFolder = ref(false)
  const newFolderName = ref('')

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
  //  comment handleNewFolder for hide new folder button
  // const handleNewFolder = () => {
  //   isCreatingNewFolder.value = true
  //   newFolderName.value = ''
  // }

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

  watch(folderPath, () => {
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
