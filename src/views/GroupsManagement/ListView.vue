<script setup>
  import { computed, onBeforeMount } from 'vue'
  import { useRouter } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { listAccountsService } from '@/services/accounts-management-services/list-accounts-service'
  import { COLUMN_STYLES, columnStyles } from '@/helpers/column-styles'
  import { useAccountStore } from '@/stores/account'
  import { DataTableActionsButtons } from '@/components/DataTable'

  defineOptions({ name: 'group-management-view' })

  const accountType = useAccountStore().accountData.kind
  const router = useRouter()

  onBeforeMount(() => {
    if (accountType !== 'company') {
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
        style: columnStyles.priority(2, 200, 350),
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
        style: columnStyles.priority(2, 200, 350),
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
        style: COLUMN_STYLES.FIT_CONTENT,
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
      <FetchListTableBlock
        :listService="listAccountsGroupDecorator"
        :columns="getColumns"
        editPagePath="/management/edit"
        emptyListMessage="No groups found."
        :frozen-columns="['name']"
        exportFileName="Group Management"
        :csvMapper="csvMapper"
        hideLastModifiedColumn
        :emptyBlock="{
          title: 'No groups yet',
          description: 'Create your first group to manage permissions for resource access.',
          createButtonLabel: 'Group',
          createPagePath: 'management/create',
          documentationService: documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
