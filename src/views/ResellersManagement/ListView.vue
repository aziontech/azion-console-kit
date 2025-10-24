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
        createPagePath="management/create"
        emptyListMessage="No reseller accounts found."
        editPagePath="management/edit"
        enableEditClick
      />

      <EmptyResultsBlock
        v-if="!hasContentToList"
        title="No resellers have been created"
        description="Click the button below to create your first reseller account."
        createButtonLabel="Reseller"
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
  import { useAccountStore } from '@/stores/account'
  import { useRouter } from 'vue-router'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { computed, ref, onBeforeMount } from 'vue'

  defineOptions({ name: 'reseller-management-view' })

  const hasContentToList = ref(true)
  const accountType = useAccountStore().accountData.kind
  const router = useRouter()
  onBeforeMount(() => {
    if (accountType !== 'brand') {
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

  const listAccountsResellerDecorator = async (params) => {
    return await listAccountsService({ account_type: 'reseller', ...params })
  }
</script>
