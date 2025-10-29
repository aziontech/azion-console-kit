<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { listAccountsService } from '@/services/accounts-management-services/list-accounts-service'
  import { useAccountStore } from '@/stores/account'
  import { useRouter } from 'vue-router'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { computed, onBeforeMount } from 'vue'

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

  const listAccountsResellerDecorator = async (params) => {
    return await listAccountsService({ account_type: 'reseller', ...params })
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Reseller Management" />
    </template>
    <template #content>
      <FetchListTableBlock
        :listService="listAccountsResellerDecorator"
        :columns="getColumns"
        addButtonLabel="Reseller"
        createPagePath="management/create"
        emptyListMessage="No reseller accounts found."
        editPagePath="management/edit"
        enableEditClick
        :frozen-columns="['name']"
        exportFileName="Reseller Management"
        :csvMapper="csvMapper"
        hideLastModifiedColumn
        :emptyBlock="{
          title: 'No resellers have been created',
          description: 'Click the button below to create your first reseller account.',
          createButtonLabel: 'Reseller',
          createPagePath: 'management/create',
          documentationService: documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
