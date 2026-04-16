<script setup>
  import { computed, ref, onBeforeMount } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import { listAccountsService } from '@/services/accounts-management-services/list-accounts-service'
  import { useAccountStore } from '@/stores/account'
  import { useRouter } from 'vue-router'
  import ListTable from '@/components/list-table/ListTable.vue'
  import { DataTableActionsButtons } from '@/components/list-table'

  defineOptions({ name: 'client-management-view' })

  const hasContentToList = ref(true)
  const accountType = useAccountStore().accountData.kind
  const router = useRouter()

  const handleNavigateToCreate = () => {
    router.push('/client/management/create')
  }

  onBeforeMount(() => {
    if (accountType !== 'reseller') {
      router.push('/')
    }
  })

  const csvMapper = (rowData) => {
    return {
      name: rowData.name,
      company: rowData.company,
      status: rowData.status?.content || rowData.status
    }
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        sortField: 'company_name',
        field: 'company',
        header: 'Company Name'
      },
      {
        disableSort: true,
        field: 'status',
        sortField: 'is_active',
        header: 'Status',
        type: 'component',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      }
    ]
  })

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const listAccountsClientDecorator = async (params) => {
    return await listAccountsService({ account_type: 'client', ...params })
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Client Management"
        description="Manage client accounts and their configurations."
      >
        <template #default>
          <div class="flex justify-between gap-2 w-full">
            <div class="flex gap-2">
              <DataTableActionsButtons
                size="small"
                label="Client"
                createPagePath="management/create"
                data-testid="create_Client_button"
              />
            </div>
          </div>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <ListTable
        :listService="listAccountsClientDecorator"
        :columns="getColumns"
        editPagePath="/client/management/edit"
        :enableEditClick="true"
        exportFileName="Client Management"
        :csvMapper="csvMapper"
        :lazy="true"
        emptyListMessage="No clients found."
        :emptyBlock="{
          title: 'No Clients yet',
          description: 'Create your first client account to manage configurations.',
          createButtonLabel: 'Client'
        }"
        @click-to-create="handleNavigateToCreate"
        @on-load-data="handleLoadData"
      />
    </template>
  </ContentBlock>
</template>
