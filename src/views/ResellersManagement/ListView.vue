<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { listAccountsService } from '@/services/accounts-management-services/list-accounts-service'
  import { useAccountStore } from '@/stores/account'
  import { useRouter } from 'vue-router'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { computed, onBeforeMount } from 'vue'
  import { DataTableActionsButtons } from '@/components/DataTable'

  defineOptions({ name: 'reseller-management-view' })

  const accountType = useAccountStore().accountData.kind
  const router = useRouter()
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
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Resellers" description="Manage reseller accounts and configurations.">
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
      <FetchListTableBlock
        :listService="listAccountsResellerDecorator"
        :columns="getColumns"
        emptyListMessage="No reseller accounts found."
        editPagePath="/management/edit"
        enableEditClick
        :frozen-columns="['name']"
        exportFileName="Reseller Management"
        :csvMapper="csvMapper"
        hideLastModifiedColumn
        :emptyBlock="{
          title: 'No Resellers yet',
          description: 'Create your first reseller account.',
          createButtonLabel: 'Reseller',
          createPagePath: 'management/create',
          documentationService: documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
