<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Client Management" />
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        :listService="listAccountsClientDecorator"
        :columns="getColumns"
        @on-load-data="handleLoadData"
        addButtonLabel="Client"
        createPagePath="management/create"
        emptyListMessage="No clients found."
        editPagePath="management/edit"
        enableEditClick
      />

      <EmptyResultsBlock
        v-if="!hasContentToList"
        title="No clients have been created"
        description="Click the button below to create your first client account."
        createButtonLabel="Client"
        createPagePath="management/create"
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
  import { useAccountStore } from '@/stores/account'
  import { useRouter } from 'vue-router'
  import { computed, ref, onBeforeMount } from 'vue'

  defineOptions({ name: 'client-management-view' })

  const hasContentToList = ref(true)
  const accountType = useAccountStore().accountData.kind
  const router = useRouter()

  onBeforeMount(() => {
    if (accountType !== 'reseller') {
      router.push('/')
    }
  })

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        sortField: 'company_name',
        field: 'company',
        header: 'Company'
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
