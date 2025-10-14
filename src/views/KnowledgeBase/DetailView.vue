<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="knowledgeBase?.name ? knowledgeBase.name : 'Knowledge Base'"
      />
    </template>
    <template #content>
      <div class="flex w-full">
        <div class="flex w-full flex-col gap-4 md:gap-8 overflow-auto">
          <div
            class="flex flex-col relative"
            @dragover.prevent="handleDrag(true)"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDropUpload"
          >
            <div
              class="flex justify-end items-center gap-2.5 mb-4"
              ref="headerContainer"
            >
              <div class="p-input-icon-left w-full md:w-64">
                <i class="pi pi-search" />
                <InputText
                  v-model="documentSearchTerm"
                  placeholder="Search documents..."
                  class="w-full"
                  @input="handleDocumentSearch"
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
                  @click="handleSettings"
                  :label="isGreaterThanXL ? 'Settings' : ''"
                  outlined
                  class="px-4 py-1 flex items-center justify-center"
                />
              </template>
              <SplitButton
                size="small"
                label="Add to files"
                @click="openDocumentSelector('files')"
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
            <UploadCard />

            <DragAndDrop
              v-if="showDragAndDrop"
              :kbId="route.params.id"
              @reload="handleRefresh"
            />
            <div
              v-else
              class="flex flex-col gap-1 items-center border-1 border-transparent justify-center w-full"
            >
              <ListTableBlock
                pageTitleDelete="Documents"
                :listService="listDocuments"
                ref="listDocumentsRef"
                :columns="getColumns"
                v-model:selectedItensData="selectedDocuments"
                hiddenHeader
                :paginator="true"
                :rows="25"
                :actions="documentActions"
                :searchFilter="documentSearchTerm"
                @delete-selected-items="handleDeleteSelectedItems"
                class="w-full"
              />

              <div class="flex items-center gap-3 text-center">
                <i class="pi pi-cloud-upload text-xl text-color-secondary"></i>
                <p class="text-sm text-color-secondary">
                  Drag documents here to add them to your knowledge base or
                  <span
                    class="cursor-pointer text-[var(--text-color-link)] transition-colors hover:underline"
                    @click="openDocumentSelector"
                  >choose your files</span>
                </p>
              </div>
            </div>

            <!-- Drag Overlay -->
            <div
              v-if="isDragOver && !showDragAndDrop"
              class="fixed inset-0 flex items-center justify-center z-50 px-8"
            >
              <div
                class="flex flex-col items-center gap-5 justify-center w-full max-w-4xl mx-auto text-center py-16 border border-solid surface-border rounded-lg transition-colors bg-[var(--surface-ground)]"
              >
                <div
                  class="rounded-full border surface-border flex items-center justify-center w-[90px] h-[90px] mb-1"
                >
                  <i class="pi pi-cloud-upload text-4xl text-color-primary"></i>
                </div>

                <div class="flex flex-col gap-2">
                  <h3 class="text-lg font-medium text-color-primary">
                    Drag documents here to add them to your knowledge base
                  </h3>

                  <p class="text-color-secondary">
                    Or
                    <span
                      class="cursor-pointer text-[var(--text-color-link)] transition-colors hover:underline"
                      @click="openDocumentSelector"
                    >choose your files</span>
                  </p>
                </div>

                <p class="text-sm text-color-secondary">Only PDF and TXT files are supported. Files larger than 300 MB cannot be uploaded.</p>
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
  import PrimeButton from 'primevue/button'
  import SplitButton from 'primevue/splitbutton'
  import InputText from 'primevue/inputtext'
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useResize } from '@/composables/useResize'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import { listDocumentsService, deleteDocumentService } from '@/services/knowledge-base-services/document-service'
  import { loadKnowledgeBaseService } from '@/services/knowledge-base-services/load-knowledge-base-service'
  import { useKnowledgeBase } from '@/composables/useKnowledgeBase'
  import UploadCard from './components/UploadCard.vue'
  import DragAndDrop from './components/DragAndDrop.vue'

  defineOptions({
    name: 'knowledge-base-detail'
  })

  const route = useRoute()
  const router = useRouter()
  const { isGreaterThanMD, isGreaterThanXL } = useResize()
  const { openDeleteDialog } = useDeleteDialog()
  const { uploadDocuments, removeDocuments, handleToast, selectedDocuments } = useKnowledgeBase()

  const knowledgeBase = ref(null)
  const documentSearchTerm = ref('')
  const listDocumentsRef = ref(null)
  const isDragOver = ref(false)
  const headerContainer = ref(null)
  const showDragAndDrop = ref(false)

  const uploadMenuItems = [
    {
      label: 'Upload Document',
      icon: 'pi pi-upload',
      command: () => openDocumentSelector('files')
    },
    {
      label: 'Upload Folder',
      icon: 'pi pi-folder',
      command: () => openDocumentSelector('folder')
    }
  ]

  const pageTitle = computed(() => {
    return knowledgeBase.value?.name || 'Knowledge Base'
  })

  const getColumns = [
    {
      field: 'name',
      header: 'Name'
    },
    {
      field: 'type',
      header: 'Type'
    },
    {
      field: 'size',
      header: 'Size'
    },
    {
      field: 'createdAt',
      header: 'Created At'
    },
    {
      field: 'status',
      header: 'Status'
    }
  ]

  const documentActions = [
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      type: 'delete',
      service: (selectedID, selectedItemData) => handleDeleteDocument(selectedItemData)
    }
  ]

  const listDocuments = async () => {
    if (!route.params.id) return []

    try {
      const documents = await listDocumentsService(route.params.id)
      console.log('📄 Raw documents from API:', documents)
      const mappedDocuments = Array.isArray(documents) ? documents.map(doc => {
        console.log('📄 Mapping document:', doc)
        const mappedDoc = {
          id: doc.document_id || doc.id,
          document_id: doc.document_id || doc.id, // Keep both for compatibility
          name: doc.name,
          type: doc.type?.toUpperCase() || 'UNKNOWN',
          size: doc.size ? formatFileSize(doc.size) : '-',
          createdAt: doc.created_at ? formatDate(doc.created_at) : '-',
          status: doc.status || 'Processing'
        }
        console.log('📄 Mapped document:', mappedDoc)
        return mappedDoc
      }) : []

      showDragAndDrop.value = !mappedDocuments?.length
      return mappedDocuments
    } catch (error) {
      console.error('Failed to load documents:', error)
      handleToast('error', 'Error', 'Failed to load documents')
      return []
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  const loadKnowledgeBase = async () => {
    if (!route.params.id) return

    try {
      const kbData = await loadKnowledgeBaseService({ id: route.params.id })
      knowledgeBase.value = kbData
    } catch (error) {
      console.error('Failed to load knowledge base:', error)
      handleToast('error', 'Error', 'Failed to load knowledge base details')
      router.push('/ai/knowledge-base')
    }
  }

  const handleDocumentSearch = () => {
    listDocumentsRef.value?.reload()
  }

  const handleRefresh = () => {
    listDocumentsRef.value?.reload()
  }

  const handleSettings = () => {
    router.push(`/ai/knowledge-base/edit/${route.params.id}`)
  }

  const openDocumentSelector = (type = 'files') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.style.display = 'none'
    input.accept = '.pdf,.txt'

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
        await uploadDocuments(files, route.params.id)
        await listDocumentsRef.value?.reload()
      }
      document.body.removeChild(input)
    }

    document.body.appendChild(input)
    input.click()
  }



  const handleDrag = (value) => {
    isDragOver.value = value
  }

  const handleDragLeave = (event) => {
    // Only set isDragOver to false if we're leaving the main container
    if (event.target === event.currentTarget) {
      isDragOver.value = false
    }
  }

  const handleDropUpload = async (event) => {
    event.stopPropagation()
    isDragOver.value = false
    const files = event.dataTransfer.files
    if (files.length > 0) {
      await uploadDocuments(files, route.params.id)
      await listDocumentsRef.value?.reload()
    }
  }

  const handleDeleteDocument = async (item) => {
    console.log('🗑️ handleDeleteDocument called with item:', item)
    console.log('🗑️ item.id:', item.id)
    console.log('🗑️ item.document_id:', item.document_id)
    console.log('🗑️ KB ID:', route.params.id)

    const documentId = item.document_id || item.id
    console.log('🗑️ Using document ID:', documentId)

    if (!documentId) {
      console.error('❌ No document ID found!', item)
      handleToast('error', 'Error', 'Document ID is missing')
      return
    }

    try {
      await deleteDocumentService(route.params.id, documentId)
      await listDocumentsRef.value?.reload()
    } catch (error) {
      console.error('Failed to delete document:', error)
      handleToast('error', 'Error', 'Failed to delete document')
    }
  }

  const handleDeleteSelectedItems = () => {
    openDeleteDialog({
      title: selectedDocuments.value.length > 1 ?
        `${selectedDocuments.value.length} selected documents` : 'Document',
      message: 'Are you sure you want to delete the selected documents?',
      data: {
        deleteConfirmationText: selectedDocuments.value[0]?.name || ''
      },
      bypassConfirmation: selectedDocuments.value.length > 1,
      deleteService: () => removeDocuments(route.params.id, selectedDocuments.value.map((doc) => doc.id)),
      successCallback: async () => {
        await listDocumentsRef.value?.reload()
      },
      closeCallback: async () => {
        selectedDocuments.value = []
        await listDocumentsRef.value?.reload()
      }
    })
  }

  watch(route, () => {
    if (route.params.id) {
      loadKnowledgeBase()
      listDocumentsRef.value?.reload()
    }
  })

  onMounted(() => {
    if (route.params.id) {
      loadKnowledgeBase()
    }
  })
</script>