<script setup>
  import ListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PrimeButton from 'primevue/button'
  import CreateDrawerBlock from '@/templates/create-drawer-block'
  import FormFieldsCredential from './FormFields/FormFieldsCredential.vue'
  import CopyCredentialDialog from './Dialog/CopyCredentialDialog.vue'
  import { ref } from 'vue'
  import { edgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'
  import { useDialog } from 'primevue/usedialog'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'
  import * as yup from 'yup'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

  const { selectedBucket } = useEdgeStorage()

  const dialog = useDialog()
  const listTableBlockRef = ref()
  const showCreateCredentialDrawer = ref(false)

  const listCredentialsService = async (params = {}) => {
    return await edgeStorageService.listCredentials(selectedBucket.value?.name, params)
  }

  const handleCreateCredential = () => {
    showCreateCredentialDrawer.value = true
  }

  const createCredentialService = async (credentialData) => {
    const body = {
      name: credentialData.name,
      capabilities: credentialData.capabilities,
      expiration_date: credentialData.expirationDate,
      bucket: selectedBucket.value.name
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
        listTableBlockRef.value?.reload()
      }
    })
  }

  const actions = [
    {
      type: 'delete',
      title: 'credential',
      icon: 'pi pi-trash',
      service: (credentialId) => edgeStorageService.deleteCredential(credentialId)
    }
  ]

  const columns = [
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
      field: 'createDate',
      header: 'Create Date'
    },
    {
      field: 'expirationDate',
      header: 'Expiration Date'
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
    expirationDate: null
  }

  defineExpose({
    handleCreateCredential
  })
</script>

<template>
  <div class="flex flex-col gap-8">
    <ListTableBlock
      ref="listTableBlockRef"
      :listService="listCredentialsService"
      :columns="columns"
      :actions="actions"
      tableName="credentials"
      :isTabs="true"
      :editInDrawer="false"
      emptyListMessage="No credentials found"
      :paginator="false"
      :enableEditClick="false"
      :emptyBlock="{
        title: 'No credentials found',
        description: 'Create a new credential to get started'
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
    </ListTableBlock>

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
