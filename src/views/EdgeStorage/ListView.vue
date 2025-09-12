<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Object Storage" />
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
            <div class="flex justify-between items-center mb-4 pt-1">
              <h2
                v-if="isGreaterThanMD"
                class="text-xl font-semibold text-color-primary truncate"
              >
                {{ selectedBucket.name }}
              </h2>
              <div class="flex w-full md:w-auto items-center gap-2.5">
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
                </template>
                <SplitButton
                  size="small"
                  label="Add to files"
                  @click="openFileSelector"
                  :model="uploadMenuItems"
                  primary
                  class="whitespace-nowrap"
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
            <UploadCard />
            <input
              ref="dragDropFileInput"
              type="file"
              multiple
              style="display: none"
              @change="handleDragDropUpload"
            />

            <DragAndDrop
              v-if="showDragAndDrop"
              :selectedBucket="selectedBucket"
              @reload="handleRefresh"
            />
            <div
              v-else
              class="flex flex-col gap-1 items-center border-1 border-transparent justify-center w-full"
              :class="{ 'border-dashed !border-[#f3652b]': isDragOver }"
            >
              <ListTableBlock
                pageTitleDelete="Files"
                :listService="listEdgeStorageBucketFiles"
                ref="listServiceFilesRef"
                :columns="getColumns"
                :selected-bucket="selectedBucket"
                v-model:selectedItensData="selectedFiles"
                hiddenHeader
                :paginator="false"
                enableEditClickFolder
                :actions="fileActions"
                :isDownloading="isDownloading"
                :searchFilter="fileSearchTerm"
                @on-row-click-edit-folder="handleEditFolder"
                @delete-selected-items="handleDeleteSelectedItems"
                @dragover.prevent="handleDrag(true)"
                @dragleave="handleDrag(false)"
                @drop.prevent="handleDragDropUpload"
                @download-selected-items="handleDownload(selectedFiles)"
                class="w-full"
              />

              <div class="flex items-center gap-3 text-center">
                <i class="pi pi-cloud-upload text-xl text-color-secondary"></i>
                <p class="text-sm text-color-secondary">
                  Drag files here to add them to your bucket or
                  <span
                    class="cursor-pointer text-[var(--text-color-link)] transition-colors hover:underline"
                    @click="openFileSelector"
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
  import DragAndDrop from './components/DragAndDrop.vue'
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useResize } from '@/composables/useResize'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import { edgeStorageService } from '@/services/v2'
  import UploadCard from './components/UploadCard.vue'

  const router = useRouter()
  const route = useRoute()
  const {
    buckets,
    selectedBucket,
    removeFiles,
    uploadFiles,
    filesTableNeedRefresh,
    handleDownload,
    selectedFiles,
    isDownloading,
    showDragAndDrop
  } = useEdgeStorage()
  const { isGreaterThanMD, isGreaterThanXL } = useResize()
  const { openDeleteDialog } = useDeleteDialog()

  defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const fileSearchTerm = ref('')
  const selectedFolder = ref(null)
  const listServiceFilesRef = ref(null)
  const isDragOver = ref(false)

  const uploadMenuItems = [
    {
      label: 'Create folder',
      icon: 'pi pi-folder',
      command: () => openFileSelector('folder')
    },
    {
      label: 'Upload files',
      icon: 'pi pi-upload',
      command: () => openFileSelector('files')
    }
  ]

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

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'size',
        header: 'Size'
      },
      {
        field: 'last_modified',
        header: 'Last Modified'
      }
    ]
  })
  const selectBucket = (bucket) => {
    showDragAndDrop.value = false
    selectedBucket.value = bucket
    selectedFolder.value = null
    selectedFiles.value = []
    listServiceFilesRef.value?.reload()
  }

  const handleSettingsTrackEvent = () => {
    router.push(`/object-storage/edit/${selectedBucket.value.id}`)
  }

  const handleFileSearch = () => {
    listServiceFilesRef.value?.reload()
  }

  const openFileSelector = (type = 'files') => {
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
        await uploadFiles(files)
        filesTableNeedRefresh.value = true
        listServiceFilesRef.value?.reload()
      }
      document.body.removeChild(input)
    }

    document.body.appendChild(input)
    input.click()
  }

  const handleEditFolder = (item) => {
    if (item.isParentNav) {
      goBackToBucket()
    } else if (item.isFolder) {
      selectedFolder.value = item
      listServiceFilesRef.value?.reload()
    }
  }

  const goBackToBucket = () => {
    selectedFolder.value = null
    listServiceFilesRef.value?.reload()
  }

  const handleDeleteSelectedItems = () => {
    openDeleteDialog({
      title:
        selectedFiles.value.length > 1 ? `${selectedFiles.value.length} selected files` : 'File',
      message: 'Are you sure you want to delete the selected files?',
      data: {
        deleteConfirmationText: selectedFiles.value[0].name
      },
      bypassConfirmation: selectedFiles.value.length > 1,
      deleteService: () => removeFiles(selectedFiles.value.map((file) => file.id)),
      successCallback: () => {
        listServiceFilesRef.value?.reload()
      },
      closeCallback: () => {
        selectedFiles.value = []
        listServiceFilesRef.value?.reload()
      }
    })
  }

  const listEdgeStorageBucketFiles = async () => {
    if (selectedBucket.value && (!selectedBucket.value.files || filesTableNeedRefresh.value)) {
      selectedBucket.value.files = await edgeStorageService.listEdgeStorageBucketFiles(
        selectedBucket.value.name
      )
      filesTableNeedRefresh.value = false
    }
    showDragAndDrop.value = !selectedBucket.value?.files?.length
    return selectedBucket.value?.files
  }

  const handleDrag = (value) => {
    isDragOver.value = value
  }

  const handleDragDropUpload = async (event) => {
    isDragOver.value = false
    const files = event.target.files || event.dataTransfer.files
    if (files.length) {
      await uploadFiles(files)
      filesTableNeedRefresh.value = true
      listServiceFilesRef.value?.reload()
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

  watch(route, () => {
    const bucket = buckets.value.find((bucket) => bucket.name === route.params.id)
    selectBucket(bucket)
  })
  onMounted(async () => {
    if (route.params.id) {
      router.replace('/object-storage')
    }
  })
</script>
