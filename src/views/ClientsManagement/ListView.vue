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
      <FetchListTableBlock
        :listService="listAccountsClientDecorator"
        :columns="getColumns"
        @on-load-data="handleLoadData"
        emptyListMessage="No clients found."
        editPagePath="/client/management/edit"
        enableEditClick
        exportFileName="Client Management"
        :csvMapper="csvMapper"
        :empty-block="{
          title: 'No Clients yet',
          description: 'Create your first client account to manage configurations.',
          createButtonLabel: 'Client',
          createPagePath: '/client/management/create'
        }"
      />
    </template>
  </ContentBlock>
</template>

<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { listAccountsService } from '@/services/accounts-management-services/list-accounts-service'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { useAccountStore } from '@/stores/account'
  import { useRouter } from 'vue-router'
  import { computed, ref, onBeforeMount } from 'vue'
  import { DataTableActionsButtons } from '@/components/DataTable'

  defineOptions({ name: 'client-management-view' })

  const hasContentToList = ref(true)
  const accountType = useAccountStore().accountData.kind
  const router = useRouter()

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
