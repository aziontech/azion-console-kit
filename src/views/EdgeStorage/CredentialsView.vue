<script setup>
  import PrimeButton from '@aziontech/webkit/button'
  import ListTable from '@/components/list-table/ListTable.vue'
  import CreateDrawerBlock from '@/templates/create-drawer-block'
  import FormFieldsCredential from './FormFields/FormFieldsCredential.vue'
  import CopyCredentialDialog from './Dialog/CopyCredentialDialog.vue'
  import { ref } from 'vue'
  import { edgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'
  import { useDialog } from '@aziontech/webkit/use-dialog'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'
  import * as yup from 'yup'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'

  const { getBucketSelected } = useEdgeStorage()

  const dialog = useDialog()
  const showCreateCredentialDrawer = ref(false)
  const bucketSelected = getBucketSelected()
  const listTableRef = ref(null)

  const listCredentialsService = async (params = {}) => {
    return await edgeStorageService.listCredentials(bucketSelected, params)
  }

  const handleCreateCredential = () => {
    showCreateCredentialDrawer.value = true
  }

  const createCredentialService = async (credentialData) => {
    const body = {
      name: credentialData.name,
      capabilities: credentialData.capabilities,
      expirationDate: credentialData.expirationDate,
      bucket: [bucketSelected]
    }
    const result = await edgeStorageService.createCredential(body)
    return result
  }

  const handleSuccessCreate = (response) => {
    showCreateCredentialDrawer.value = false
    dialog.open(CopyCredentialDialog, {
      props: {
        header: 'Credential has been created',
        modal: true,
        blockScroll: true,
        style: { width: '32rem' }
      },
      data: {
        credential: response.data
      },
      onClose: () => {
        listTableRef.value?.reload()
      }
    })
  }

  const actions = [
    {
      label: 'Delete',
      type: 'delete',
      title: 'credential',
      icon: 'pi pi-trash',
      warningMessage:
        "This credential affect all buckets. Once confirmed, this action can't be reversed. ",
      description:
        'The selected credential will be deleted. Check the Help Center for more details.',
      service: (credentialId) => edgeStorageService.deleteCredential(credentialId)
    }
  ]

  const credentialColumns = [
    {
      field: 'name',
      header: 'Name'
    },
    {
      field: 'accessKey',
      header: 'Access Key',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({ data: columnData, columnAppearance: 'text-with-clipboard' })
      }
    },
    {
      field: 'capabilities',
      header: 'Capabilities',
      type: 'component',
      style: 'max-width: 300px',
      component: (columnData) => {
        return columnBuilder({ data: columnData, columnAppearance: 'text-array-with-popup' })
      }
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
      field: 'lastModify',
      header: 'Last Modified',
      sortField: 'lastModify',
      filterPath: 'lastModify'
    }
  ]

  const validationSchema = yup.object({
    name: yup
      .string()
      .required('Name is required')
      .matches(/^[a-zA-Z0-9-]+$/, 'Name must contain only letters, numbers, and hyphens'),
    capabilities: yup.array().min(1, 'At least one capability is required'),
    expirationDate: yup.date().required('Expiration date is required')
  })

  const initialValues = {
    name: '',
    capabilities: [],
    expirationDate: null,
    bucket: []
  }

  defineExpose({
    openCreateDrawer: handleCreateCredential
  })
</script>

<template>
  <div class="flex flex-col gap-8">
    <ListTable
      ref="listTableRef"
      :listService="listCredentialsService"
      :columns="credentialColumns"
      :actions="actions"
      :enableEditClick="false"
      defaultOrderingFieldName="-last_modified"
      exportFileName="Credentials"
      emptyListMessage="No credentials found"
      isTabs
      :emptyBlock="{
        title: 'No credentials yet',
        description:
          'Create your first credential to manage bucket access through S3 protocol with specific operation permissions.'
      }"
    >
      <template #emptyBlockButton>
        <PrimeButton
          icon="pi pi-plus"
          label="Credential"
          severity="secondary"
          size="small"
          @click="handleCreateCredential"
          data-testid="create_credential_button_empty"
        />
      </template>
    </ListTable>

    <CreateDrawerBlock
      v-if="showCreateCredentialDrawer"
      v-model:visible="showCreateCredentialDrawer"
      :createService="createCredentialService"
      :schema="validationSchema"
      :initialValues="initialValues"
      @onSuccess="handleSuccessCreate"
      title="Create Credential"
      disableAfterCreateToastFeedback
    >
      <template #formFields>
        <FormFieldsCredential />
      </template>
    </CreateDrawerBlock>
  </div>
</template>
