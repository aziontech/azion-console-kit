<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock :pageTitle="pageTitle" />
    </template>
    <template #content>
      <div class="flex w-full">
        <div class="flex w-full flex-col gap-4 md:gap-8 overflow-auto">
          <div class="flex flex-col">
            <div
              class="flex justify-between items-start mb-4 pt-1 relative"
              ref="headerContainer"
            >
              <div class="flex-shrink min-w-0 overflow-hidden">
                <div class="flex items-center gap-2 mb-2">
                  <i class="pi pi-book text-2xl text-primary"></i>
                  <h1 class="text-2xl font-semibold">{{ knowledgeBase?.name || 'Knowledge Base' }}</h1>
                </div>
                <p v-if="knowledgeBase?.description" class="text-color-secondary mb-2">
                  {{ knowledgeBase.description }}
                </p>
                <div class="flex items-center gap-4 text-sm text-color-secondary">
                  <span class="flex items-center gap-1">
                    <i class="pi pi-microchip"></i>
                    {{ knowledgeBase?.embedding_model || 'Unknown' }}
                  </span>
                  <span class="flex items-center gap-1">
                    <i class="pi pi-user"></i>
                    {{ knowledgeBase?.lastEditor || 'Unknown' }}
                  </span>
                  <span class="flex items-center gap-1">
                    <i class="pi pi-calendar"></i>
                    {{ knowledgeBase?.updatedAt || 'Unknown' }}
                  </span>
                </div>
              </div>
              <div class="flex w-full md:w-auto items-center gap-2.5">
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
            </div>

            <div
              class="flex flex-col gap-1 items-center border-1 border-transparent justify-center w-full"
              :class="{ 'border-dashed !border-[#f3652b]': isDragOver }"
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
                @dragover.prevent="handleDrag(true)"
                @dragleave="handleDrag(false)"
                @drop.prevent="handleDropUpload"
                class="w-full"
              />

              <div class="flex items-center gap-3 text-center py-4">
                <i class="pi pi-file-upload text-xl text-color-secondary"></i>
                <p class="text-sm text-color-secondary">
                  Drag documents here to add them to your knowledge base or
                  <span
                    class="cursor-pointer text-[var(--text-color-link)] transition-colors hover:underline"
                    @click="openDocumentSelector"
                  >choose your files</span>
                </p>
                <p class="text-xs text-color-secondary">
                  Supported formats: PDF, TXT
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
  import PrimeButton from 'primevue/button'
  import SplitButton from 'primevue/splitbutton'
  import InputText from 'primevue/inputtext'
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useResize } from '@/composables/useResize'
  import { useToast } from 'primevue/usetoast'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import { createDocumentService, listDocumentsService, deleteDocumentService } from '@/services/knowledge-base-services/document-service'
  import { loadKnowledgeBaseService } from '@/services/knowledge-base-services/load-knowledge-base-service'

  defineOptions({
    name: 'knowledge-base-detail'
  })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const { isGreaterThanMD, isGreaterThanXL } = useResize()
  const { openDeleteDialog } = useDeleteDialog()

  const knowledgeBase = ref(null)
  const documentSearchTerm = ref('')
  const selectedDocuments = ref([])
  const listDocumentsRef = ref(null)
  const isDragOver = ref(false)
  const headerContainer = ref(null)

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
      header: 'Document Name'
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
      field: 'created_at',
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
      service: (item) => handleDeleteDocument(item)
    }
  ]

  const listDocuments = async () => {
    if (!route.params.id) return []

    try {
      const documents = await listDocumentsService(route.params.id)
      return Array.isArray(documents) ? documents.map(doc => ({
        id: doc.document_id || doc.id,
        name: doc.name,
        type: doc.type?.toUpperCase() || 'UNKNOWN',
        size: doc.size ? formatFileSize(doc.size) : 'Unknown',
        created_at: doc.created_at ? formatDate(doc.created_at) : 'Unknown',
        status: doc.status || 'Processing'
      })) : []
    } catch (error) {
      console.error('Failed to load documents:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load documents',
        life: 5000
      })
      return []
    }
  }

  const loadKnowledgeBase = async () => {
    if (!route.params.id) return

    try {
      const kbData = await loadKnowledgeBaseService({ id: route.params.id })
      knowledgeBase.value = kbData
    } catch (error) {
      console.error('Failed to load knowledge base:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load knowledge base details',
        life: 5000
      })
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
        if (type === 'folder') {
          // Handle folder upload - process all files in the folder
          await handleFolderUpload(files)
        } else {
          // Handle multiple file uploads directly
          await handleMultipleFileUploads(files)
        }
      }
      document.body.removeChild(input)
    }

    document.body.appendChild(input)
    input.click()
  }


  const handleMultipleFileUploads = async (files) => {
    const validFiles = []
    const errors = []

    // Validate files first
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const extension = file.name.split('.').pop().toLowerCase()

      if (!['pdf', 'txt'].includes(extension)) {
        errors.push(`Skipped ${file.name}: Unsupported file type`)
      } else {
        validFiles.push(file)
      }
    }

    if (validFiles.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'No Valid Files',
        detail: 'No valid PDF or TXT files to upload',
        life: 5000
      })
      return
    }

    // Show uploading toast
    const uploadingToast = toast.add({
      severity: 'info',
      summary: 'Uploading...',
      detail: `Uploading ${validFiles.length} file${validFiles.length > 1 ? 's' : ''}...`,
      life: 0, // Don't auto-dismiss
      closable: false
    })

    let successCount = 0
    let errorCount = 0

    // Upload files
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]

      // Update progress in toast
      toast.add({
        severity: 'info',
        summary: 'Uploading...',
        detail: `Uploading ${i + 1} of ${validFiles.length}: ${file.name}`,
        life: 0,
        closable: false,
        group: 'upload-progress'
      })

      try {
        await createDocumentService(route.params.id, file)
        successCount++
      } catch (error) {
        errorCount++
        errors.push(`Failed to upload ${file.name}: ${error.message}`)
      }
    }

    // Remove uploading toast
    toast.removeGroup('upload-progress')

    // Show results
    if (successCount > 0) {
      toast.add({
        severity: 'success',
        summary: 'Upload Complete',
        detail: `${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully`,
        life: 5000
      })
    }

    if (errorCount > 0 || errors.length > 0) {
      toast.add({
        severity: 'error',
        summary: 'Upload Errors',
        detail: `${errorCount > 0 ? errorCount + ' file' + (errorCount > 1 ? 's' : '') + ' failed. ' : ''}${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`,
        life: 8000
      })
    }

    // Refresh the list
    listDocumentsRef.value?.reload()
  }

  const handleFolderUpload = async (files) => {
    await handleMultipleFileUploads(files)
  }



  const handleDrag = (value) => {
    isDragOver.value = value
  }

  const handleDropUpload = async (event) => {
    isDragOver.value = false
    const files = event.dataTransfer.files
    if (files.length > 0) {
      await handleMultipleFileUploads(files)
    }
  }

  const handleDeleteDocument = async (item) => {
    try {
      await deleteDocumentService(route.params.id, item.id)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Document deleted successfully',
        life: 5000
      })
      listDocumentsRef.value?.reload()
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete document',
        life: 5000
      })
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
      deleteService: async () => {
        for (const document of selectedDocuments.value) {
          await deleteDocumentService(route.params.id, document.id)
        }
      },
      successCallback: () => {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Documents deleted successfully',
          life: 5000
        })
        listDocumentsRef.value?.reload()
      },
      closeCallback: () => {
        selectedDocuments.value = []
        listDocumentsRef.value?.reload()
      }
    })
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
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