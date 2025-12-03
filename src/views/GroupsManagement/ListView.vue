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
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Groups">
        <template #default>
          <div class="flex justify-between gap-2 w-full">
            <div class="flex gap-2">
              <DataTableActionsButtons
                size="small"
                label="Group"
                createPagePath="management/create"
                data-testid="create_Group_button"
              />
            </div>
          </div>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        :listService="listAccountsGroupDecorator"
        :columns="getColumns"
        editPagePath="management/edit"
        emptyListMessage="No groups found."
        :frozen-columns="['name']"
        exportFileName="Group Management"
        :csvMapper="csvMapper"
        hideLastModifiedColumn
        :emptyBlock="{
          title: 'No groups have been created',
          description: 'Click the button below to create your first group account.',
          createButtonLabel: 'Group',
          createPagePath: 'management/create'
        }"
      />
    </template>
  </ContentBlock>
</template>
