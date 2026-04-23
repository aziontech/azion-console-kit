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

  defineOptions({ name: 'reseller-management-view' })

  const accountType = useAccountStore().accountData.kind
  const router = useRouter()

  const handleNavigateToCreate = () => {
    router.push('management/create')
  }

  onBeforeMount(() => {
    if (accountType !== 'brand') {
      router.push('/')
    }
  })

  const csvMapper = (rowData) => {
    return {
      name: rowData.name,
      company: rowData.company,
      status: rowData.data?.content
    }
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name',
        type: 'component',
        style: 'max-width: 300px',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-format-with-popup'
          })
        }
      },
      {
        sortField: 'company_name',
        field: 'company',
        header: 'Company Name',
        type: 'component',
        style: 'max-width: 300px',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-format-with-popup'
          })
        }
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

  const listAccountsResellerDecorator = async (params) => {
    return await listAccountsService({ account_type: 'reseller', ...params })
  }

  const hasContentToList = ref(true)
  const frozenColumns = ['name']

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Resellers"
        description="Manage reseller accounts and configurations."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Reseller"
            createPagePath="management/create"
            data-testid="create_Reseller_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <ListTable
        :listService="listAccountsResellerDecorator"
        :columns="getColumns"
        editPagePath="/management/edit"
        :enableEditClick="true"
        exportFileName="Reseller Management"
        :csvMapper="csvMapper"
        :lazy="true"
        :frozenColumns="frozenColumns"
        :hideLastModifiedColumn="true"
        emptyListMessage="No reseller accounts found."
        :emptyBlock="{
          title: 'No Resellers yet',
          description: 'Create your first reseller account.',
          createButtonLabel: 'Reseller'
        }"
        @click-to-create="handleNavigateToCreate"
        @on-load-data="handleLoadData"
      />
    </template>
  </ContentBlock>
</template>
