<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Storage" />
    </template>
    <template #content>
      <div class="flex h-full w-full gap-8">
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

            <div class="flex-1 overflow-y-auto">
              <div
                v-if="isLoading"
                class="text-center py-4"
              >
                <i class="pi pi-spin pi-spinner text-2xl text-color-secondary"></i>
              </div>
              <div
                v-else-if="filteredBuckets.length === 0"
                class="text-left py-2"
              >
                <div class="text-color-secondary text-sm">
                  {{ searchTerm ? 'No buckets found' : 'No buckets created yet' }}
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
                    <span class="text-sm font-medium text-color-primary">{{ bucket.name }}</span>
                    <span class="text-xs text-color-secondary">{{ bucket.size }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div class="flex w-full flex-col gap-8">
          <template v-if="!isGreaterThanMD">
            <div class="flex flex-col gap-4">
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

              <div class="flex-1 overflow-y-auto">
                <div
                  v-if="isLoading"
                  class="text-center py-4"
                >
                  <i class="pi pi-spin pi-spinner text-2xl text-color-secondary"></i>
                </div>
                <div
                  v-else-if="filteredBuckets.length === 0"
                  class="text-left py-2"
                >
                  <div class="text-color-secondary text-sm">
                    {{ searchTerm ? 'No buckets found' : 'No buckets created yet' }}
                  </div>
                </div>
                <div
                  v-else
                  class="space-y-2"
                >
                  <div
                    v-for="bucket in filteredBuckets"
                    :key="bucket.id"
                    class="p-3 cursor-pointer hover:bg-[--table-bg-color] transition-colors"
                    :class="{
                      'bg-[--table-bg-color]': selectedBucket?.id === bucket.id
                    }"
                    @click="selectBucket(bucket)"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex-1">
                        <div class="font-medium text-color-primary">{{ bucket.name }}</div>
                        <div class="font-medium text-color-primary">{{ bucket.size }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <div
            v-if="selectedBucket"
            class="flex flex-col h-full"
          >
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-semibold text-color-primary">{{ selectedBucket.name }}</h2>
              <div class="flex items-center gap-3">
                <div class="p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText
                    v-model="fileSearchTerm"
                    placeholder="Search in folder"
                    class="w-64"
                    @input="handleFileSearch"
                  />
                </div>
                <PrimeButton
                  icon="pi pi-refresh"
                  size="small"
                  outlined
                  label="Refresh"
                  class="px-4 py-1 flex items-center justify-center"
                />
                <PrimeButton
                  icon="pi pi-cog"
                  size="small"
                  @click="handleSettingsTrackEvent"
                  label="Settings"
                  outlined
                  class="px-4 py-1 flex items-center justify-center"
                />
                <PrimeButton
                  size="small"
                  @click="openFileSelector"
                  label="Add to files"
                  iconPos="right"
                  icon="pi pi-chevron-down"
                  primary
                  class="px-4 py-1 cursor-pointer flex items-center justify-center"
                />
              </div>
            </div>
            <ListTableBlock
              v-if="!!selectedBucket"
              pageTitleDelete="Files"
              :listService="listEdgeStorageBucketFiles"
              ref="listServiceFilesRef"
              :columns="getColumns"
              v-model:selectedItensData="selectedFiles"
              hiddenHeader
              :paginator="false"
              enableEditClickFolder
              @on-row-click-edit-folder="handleEditFolder"
              @delete-selected-items="handleDeleteSelectedItems"
            />

            <DragAndDrop
              v-else
              :selectedBucket="selectedBucket"
            />
          </div>
          <EmptyResultsBlock
            v-else
            title="No buckets created"
            description="Create your first bucket here."
            createButtonLabel="Bucket"
            @click-to-create="handleCreateTrackEvent"
            :documentationService="documentationService"
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
  import InputText from 'primevue/inputtext'
  import DragAndDrop from './components/DragAndDrop.vue'
  import { ref, computed, inject, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useResize } from '@/composables/useResize'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import { edgeStorageService } from '@/services/v2'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const router = useRouter()
  const { buckets, selectedBucket, handleFileSelect, removeFiles } = useEdgeStorage()
  const { isGreaterThanMD } = useResize()
  const { openDeleteDialog } = useDeleteDialog()

  defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const selectedFiles = ref([])
  const searchTerm = ref('')
  const fileSearchTerm = ref('')
  const selectedFolder = ref(null)
  const isLoading = ref(false)

  const listServiceFilesRef = ref(null)

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
        field: 'lastModified',
        header: 'Last Modified'
      }
    ]
  })
  const selectBucket = (bucket) => {
    listServiceFilesRef.value?.reload()
    selectedBucket.value = bucket
    selectedFolder.value = null
  }

  const handleSearch = () => {
    if (
      selectedBucket.value &&
      !filteredBuckets.value.find((bucket) => bucket.id === selectedBucket.value.id)
    ) {
      selectedBucket.value = filteredBuckets.value[0] || null
    }
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

  const openFileSelector = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.style.display = 'none'

    input.onchange = (event) => {
      const files = event.target.files
      if (files.length > 0 && selectedBucket.value) {
        handleFileSelect(event, selectedBucket.value.id)
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
      title: `${selectedFiles.value.length} selected items`,
      message: 'Are you sure you want to delete the selected items?',
      data: {
        deleteConfirmationText:
          selectedFiles.value.length === 1
            ? selectedFiles.value[0].name
            : `${selectedFiles.value.length} selected items`
      },
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

  onMounted(async () => {
    try {
      isLoading.value = true
      const response = await edgeStorageService.listEdgeStorageBuckets()
      buckets.value = response.body
    } catch (error) {
      isLoading.value = false
    } finally {
      isLoading.value = false
    }
  })
</script>
