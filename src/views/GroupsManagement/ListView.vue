<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EmptyResultsBlock from '@aziontech/webkit/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import { listAccountsService } from '@/services/accounts-management-services/list-accounts-service'
  import { useAccountStore } from '@/stores/account'
  import { useRouter } from 'vue-router'
  import { computed, onBeforeMount, ref } from 'vue'
  import ListTable from '@/components/list-table'
  import { DataTableActionsButtons } from '@/components/list-table'

  defineOptions({ name: 'group-management-view' })

  const accountType = useAccountStore().accountData.kind
  const router = useRouter()
  const hasContentToList = ref(true)
  const listTableRef = ref()

  onBeforeMount(() => {
    if (accountType !== 'company') {
      router.push('/')
    }
  })

  const handleNavigateToCreate = () => {
    router.push('management/create')
  }

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

  const listAccountsGroupDecorator = async (params) => {
    return await listAccountsService({ account_type: 'group', ...params })
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Groups"
        description="Manage groups and assign permissions for resource access."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Group"
            createPagePath="management/create"
            data-testid="create_Group_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <ListTable
        v-if="hasContentToList"
        ref="listTableRef"
        :listService="listAccountsGroupDecorator"
        :columns="getColumns"
        :frozenColumns="['name']"
        editPagePath="/management/edit"
        exportFileName="Group Management"
        :csvMapper="csvMapper"
        :hideLastModifiedColumn="true"
        emptyListMessage="No groups found."
        @on-load-data="handleLoadData"
      />
      <EmptyResultsBlock
        v-else
        title="No groups yet"
        description="Create your first group to manage permissions for resource access."
        createButtonLabel="Group"
        @click-to-create="handleNavigateToCreate"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>
