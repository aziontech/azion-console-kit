<script setup>
  import { ref, computed } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import ListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { EdgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'
  import CredentialDrawer from '../Drawer/index.vue'

  defineOptions({ name: 'object-storage-credentials-list-view' })

  defineProps({
    documentationService: {
      type: Function,
      required: true
    }
  })

  const toast = useToast()
  const hasContentToList = ref(true)
  const listTableBlockRef = ref('')
  const credentialDrawerRef = ref(null)
  const edgeStorageService = new EdgeStorageService()

  const getColumns = computed(() => [
    {
      field: 'name',
      header: 'Name'
    },
    {
      field: 'accessKey',
      header: 'Access Key'
    },
    {
      field: 'capabilities',
      header: 'Capabilities',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: { value: columnData },
          columnAppearance: 'expand-text-column'
        })
      }
    },
    {
      field: 'bucket',
      header: 'Bucket'
    },
    {
      field: 'createDate',
      header: 'Create Date'
    },
    {
      field: 'expirationDate',
      header: 'Expiration Date'
    },
    {
      field: 'lastEditor',
      header: 'Last Editor',
      sortField: 'last_editor',
      filterPath: 'last_editor'
    },
    {
      field: 'lastModified',
      header: 'Last Modified',
      sortField: 'lastModified',
      filterPath: 'lastModified'
    }
  ])

  const listCredentialsService = async (params) => {
    return await edgeStorageService.listCredentials('', params)
  }

  const deleteCredentialService = async (credentialId) => {
    return await edgeStorageService.deleteCredential(credentialId)
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const handleFailedToDelete = (error) => {
    const { fieldName, message } = error
    toast.add({
      closable: true,
      severity: 'error',
      summary: `${fieldName}: ${message}`
    })
  }

  const reloadList = () => {
    if (hasContentToList.value) {
      listTableBlockRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  const handleCreateCredential = () => {
    credentialDrawerRef.value.openCreateDrawer()
  }

  const handleCredentialCreated = () => {
    reloadList()
  }

  const actions = [
    {
      label: 'Delete',
      type: 'delete',
      title: 'credential',
      icon: 'pi pi-trash',
      service: deleteCredentialService,
      showOnlyOnHover: true
    }
  ]

  defineExpose({
    handleCreateCredential
  })
</script>

<template>
  <div class="w-full">
    <ListTableBlock
      ref="listTableBlockRef"
      :listService="listCredentialsService"
      :columns="getColumns"
      :enable-edit-click="false"
      addButtonLabel="Credential"
      @on-load-data="handleLoadData"
      @on-before-go-to-add-page="handleCreateCredential"
      :actions="actions"
      @on-failed-to-delete="handleFailedToDelete"
      emptyListMessage="No credentials found."
      isTabs
      :emptyBlock="{
        title: 'No Object Storage credentials yet',
        description: 'Create your first Object Storage credential to authenticate and control access to buckets.',
        createButtonLabel: 'Credential',
        documentationService: documentationService
      }"
      exportFileName="Object Storage Credentials"
    />
    <CredentialDrawer
      ref="credentialDrawerRef"
      @onSuccess="handleCredentialCreated"
    />
  </div>
</template>
