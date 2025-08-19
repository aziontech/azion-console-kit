<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Storage" />
    </template>
    <template #content>
      <div class="flex w-full gap-8">
        <template v-if="isGreaterThanMD">
          <div class="flex flex-col w-80 gap-4">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-medium text-color-primary">Buckets</h3>
              <PrimeButton
                icon="pi pi-plus"
                size="small"
                outlined
                @click="handleCreateTrackEvent"
                data-testid="create-bucket-button"
                class="w-8 h-8 p-0 flex items-center justify-center"
              />
            </div>

            <div class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText
                v-model="searchTerm"
                placeholder="Search buckets"
                class="w-full"
                @input="handleSearch"
              />
            </div>

            <div class="flex-1 overflow-y-auto max-h-[calc(100svh-40%)]">
              <div
                v-if="isLoading"
                class="flex flex-col gap-3"
              >
                <div
                  v-for="index in 3"
                  :key="index"
                  class="py-2 rounded"
                >
                  <div class="flex items-center justify-between">
                    <Skeleton class="h-4 w-32" />
                  </div>
                </div>
              </div>
              <div
                v-else-if="!filteredBuckets.length"
                class="text-left py-2"
              >
                <div class="text-color-secondary text-sm">
                  {{ searchTerm ? 'No buckets found.' : 'No buckets created yet.' }}
                </div>
              </div>
              <div v-else>
                <div
                  v-for="bucket in filteredBuckets"
                  :key="bucket.id"
                  class="p-3 rounded cursor-pointer hover:bg-[--table-bg-color] transition-colors"
                  :class="{ 'bg-[--table-bg-color]': selectedBucket?.id === bucket.id }"
                  @click="selectBucket(bucket)"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-color-primary truncate">{{
                      bucket.name
                    }}</span>
                    <span class="text-xs text-color-secondary">{{ bucket.size }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div class="flex w-full flex-col gap-4 md:gap-8 overflow-auto">
          <template v-if="!isGreaterThanMD">
            <div class="flex flex-col gap-1">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-medium text-color-primary">Buckets</h3>
                <PrimeButton
                  icon="pi pi-plus"
                  size="small"
                  outlined
                  @click="handleCreateTrackEvent"
                  data-testid="create-bucket-button"
                  class="w-8 h-8 p-0 flex items-center justify-center"
                />
              </div>

              <div class="flex items-center gap-2">
                <Dropdown
                  v-model="selectedBucket"
                  :options="buckets"
                  optionLabel="name"
                  placeholder="Select a bucket"
                  filter
                  filterPlaceholder="Search buckets"
                  :loading="isLoading"
                  class="w-full"
                  :pt="{
                    root: { class: 'w-full' },
                    input: { class: 'w-full' }
                  }"
                  @change="handleBucketChange"
                >
                  <template #value="slotProps">
                    <div
                      v-if="slotProps.value"
                      class="flex items-center"
                    >
                      <div>
                        <div class="font-medium">{{ slotProps.value.name }}</div>
                        <div class="text-sm text-color-secondary">{{ slotProps.value.size }}</div>
                      </div>
                    </div>
                    <span v-else>{{ slotProps.placeholder }}</span>
                  </template>
                  <template #option="slotProps">
                    <div class="flex items-center">
                      <div>
                        <div class="font-medium">{{ slotProps.option.name }}</div>
                        <div class="text-sm text-color-secondary">{{ slotProps.option.size }}</div>
                      </div>
                    </div>
                  </template>
                </Dropdown>
                <template v-if="!isGreaterThanMD">
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
              </div>
            </div>
          </template>
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
            />
            <div
              v-else
              class="flex flex-col gap-1 items-center border-1 border-transparent justify-center w-full"
              :class="{ 'border-dashed border-[#f3652b]': isDragOver }"
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
          <EmptyResultsBlock
            v-else
            title="No buckets created"
            description="Create your first bucket here"
            createButtonLabel="Bucket"
            @click-to-create="handleCreateTrackEvent"
            :documentationService="documentationGuideProducts.edgeStorage"
          >
            <template #illustration>
              <Illustration />
            </template>
          </EmptyResultsBlock>
        </div>
      </div>
    </template>
  </ContentBlock>
</template>

<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ListTableBlock from '@/templates/list-table-block/folder-list.vue'
  import PrimeButton from 'primevue/button'
  import SplitButton from 'primevue/splitbutton'
  import InputText from 'primevue/inputtext'
  import Skeleton from 'primevue/skeleton'
  import Dropdown from 'primevue/dropdown'
  import DragAndDrop from './components/DragAndDrop.vue'
  import { ref, computed, inject, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useResize } from '@/composables/useResize'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import { edgeStorageService } from '@/services/v2'
  import UploadCard from './components/UploadCard.vue'
  import { documentationGuideProducts } from '@/helpers/azion-documentation-catalog'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const router = useRouter()
  const {
    buckets,
    selectedBucket,
    removeFiles,
    createdBucket,
    uploadFiles,
    needRefresh,
    handleDownload,
    selectedFiles,
    isDownloading
  } = useEdgeStorage()
  const { isGreaterThanMD, isGreaterThanXL } = useResize()
  const { openDeleteDialog } = useDeleteDialog()

  defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const searchTerm = ref('')
  const fileSearchTerm = ref('')
  const selectedFolder = ref(null)
  const isLoading = ref(false)
  const listServiceFilesRef = ref(null)
  const isDragOver = ref(false)
  const showDragAndDrop = ref(false)

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

  const filteredBuckets = computed(() => {
    if (!searchTerm.value) return buckets.value
    return buckets.value.filter((bucket) =>
      bucket.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
  })

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

  const handleBucketChange = (event) => {
    selectBucket(event.value)
  }

  const handleCreateTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Edge Storage'
    })
    router.push('/edge-storage/create')
  }

  const handleSettingsTrackEvent = () => {
    router.push(`/edge-storage/edit/${selectedBucket.value.id}`)
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
    if (!selectedBucket.value.files || needRefresh.value) {
      selectedBucket.value.files = await edgeStorageService.listEdgeStorageBucketFiles(
        selectedBucket.value.name
      )
      needRefresh.value = false
    }
    showDragAndDrop.value = !selectedBucket.value.files?.length
    return selectedBucket.value.files
  }

  const handleDrag = (value) => {
    isDragOver.value = value
  }

  const handleDragDropUpload = async (event) => {
    isDragOver.value = false
    const files = event.target.files || event.dataTransfer.files
    if (files.length) {
      await uploadFiles(files)
      listServiceFilesRef.value?.reload()
    }
  }

  const handleRefresh = () => {
    needRefresh.value = true
    listServiceFilesRef.value?.reload()
  }

  const handleDeleteFile = async (item) => {
    await edgeStorageService.deleteEdgeStorageBucketFiles(selectedBucket.value.name, item)
    needRefresh.value = true
    listServiceFilesRef.value?.reload()
  }

  onMounted(async () => {
    try {
      isLoading.value = true
      const response = await edgeStorageService.listEdgeStorageBuckets()
      buckets.value = response.body
      if (createdBucket.value) {
        selectedBucket.value = buckets.value.find((bucket) => bucket.name === createdBucket.value)
        createdBucket.value = ''
      } else if (buckets.value.length) {
        selectedBucket.value = buckets.value[0]
      }
    } catch (error) {
      isLoading.value = false
    } finally {
      isLoading.value = false
    }
  })
</script>
