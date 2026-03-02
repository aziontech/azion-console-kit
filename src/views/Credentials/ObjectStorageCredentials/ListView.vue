<script setup>
  import { ref, computed } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import ListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { EdgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'
  import { COLUMN_STYLES, columnStyles } from '@/helpers/column-styles'
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
      header: 'Name',
      style: columnStyles.priority(2, 200, 350)
    },
    {
      field: 'accessKey',
      header: 'Access Key',
      type: 'component',
      style: COLUMN_STYLES.FIT_CONTENT,
      component: (columnData) => {
        return columnBuilder({ data: columnData, columnAppearance: 'text-with-clipboard' })
      }
    },
    {
      field: 'capabilities',
      header: 'Capabilities',
      type: 'component',
      style: columnStyles.priority(3, 200, 300),
      component: (columnData) => {
        return columnBuilder({ data: columnData, columnAppearance: 'text-array-with-popup' })
      }
    },
    {
      field: 'bucket',
      header: 'Bucket',
      type: 'component',
      style: columnStyles.priority(2, 150, 250),
      component: (columnData) => {
        if (Array.isArray(columnData)) {
          return columnBuilder({ data: columnData, columnAppearance: 'text-array-with-popup' })
        }

        if (columnData && typeof columnData === 'object' && 'content' in columnData) {
          return columnBuilder({ data: columnData, columnAppearance: 'tag' })
        }

        return columnBuilder({ data: [], columnAppearance: 'text-array-with-popup' })
      }
    },
    {
      field: 'createDate',
      header: 'Create Date',
      style: COLUMN_STYLES.FIT_CONTENT
    },
    {
      field: 'expirationDate',
      header: 'Expiration Date',
      style: COLUMN_STYLES.FIT_CONTENT
    },
    {
      field: 'lastEditor',
      header: 'Last Editor',
      sortField: 'last_editor',
      filterPath: 'last_editor',
      style: COLUMN_STYLES.PRIORITY_SM
    },
    {
      field: 'lastModify',
      header: 'Last Modified',
      sortField: 'lastModify',
      filterPath: 'lastModify',
      style: COLUMN_STYLES.FIT_CONTENT
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
      warningMessage:
        "This credential affect all buckets. Once confirmed, this action can't be reversed. ",
      description:
        'The selected credential will be deleted. Check the Help Center for more details.',
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
      default-ordering-field-name="-last_modified"
      emptyListMessage="No credentials found."
      isTabs
      :emptyBlock="{
        title: 'No Object Storage credentials yet',
        description:
          'Create your first Object Storage credential to authenticate and control access to buckets.',
        createButtonLabel: 'Credential',
        onClickCreate: () => handleCreateCredential(),
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
