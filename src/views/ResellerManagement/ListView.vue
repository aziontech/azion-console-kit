<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Reseller Management" />
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        :listService="listAccountsResellerDecorator"
        :columns="getColumns"
        @on-load-data="handleLoadData"
        addButtonLabel="Reseller"
        createPagePath="reseller/management/create"
        emptyListMessage="No reseller accounts found."
      />

      <EmptyResultsBlock
        v-if="!hasContentToList"
        title="No resellers have been created"
        description="Click the button below to create your first reseller account."
        createButtonLabel="Reseller"
        createPagePath="reseller/management/create"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { listAccountsService } from '@/services/accounts-management-services/list-accounts-service'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { computed, ref } from 'vue'

  defineOptions({ name: 'reseller-management-view' })

  const hasContentToList = ref(true)

  const getColumns = computed(() => {
    return [
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
      },
      {
        field: 'name',
        header: 'Name'
      },
      {
        sortField: 'company_name',
        field: 'company',
        header: 'Company'
      }
    ]
  })

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const listAccountsResellerDecorator = async (params) => {
    return await listAccountsService({ account_type: 'reseller', ...params })
  }
</script>
