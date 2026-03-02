<script setup>
  import { computed, inject } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { teamPermissionService } from '@/services/v2/team-permission'
  import { COLUMN_STYLES, columnStyles } from '@/helpers/column-styles'
  import { documentationAccountsProducts } from '@/helpers/azion-documentation-catalog'
  import { DataTableActionsButtons } from '@/components/DataTable'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const actions = [
    {
      label: 'Delete',
      type: 'delete',
      title: 'team',
      icon: 'pi pi-trash',
      service: teamPermissionService.delete
    }
  ]

  const csvMapper = (rowData) => {
    return {
      name: rowData.name,
      permissions: rowData.permissions,
      status: rowData.data?.content || rowData.status
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
        field: 'permissions',
        header: 'Permissions',
        type: 'component',
        disableSort: true,
        style: columnStyles.priority(3, 200, 300),
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'text-array-with-popup' })
      },
      {
        field: 'status',
        header: 'Status',
        type: 'component',
        sortField: 'is_active',
        style: COLUMN_STYLES.FIT_CONTENT,
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      }
    ]
  })

  const handleTrackEventGoToCreate = () => {
    tracker.product.clickToCreate({
      productName: 'Teams Permissions'
    })
  }

  const handleTrackEventGoToEdit = () => {
    tracker.product.clickToEdit({
      productName: 'Team'
    })
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Teams"
        description="Define and manage permissions for team collaboration."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Team"
            @click="handleTrackEventGoToCreate"
            createPagePath="teams-permission/create"
            data-testid="create_Team_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        :listService="teamPermissionService.list"
        :columns="getColumns"
        editPagePath="/teams-permission/edit"
        emptyListMessage="No teams found."
        :actions="actions"
        @on-before-go-to-add-page="handleTrackEventGoToCreate"
        @on-before-go-to-edit="handleTrackEventGoToEdit"
        :defaultOrderingFieldName="'name'"
        :frozenColumns="['name']"
        exportFileName="Teams Permissions"
        :csvMapper="csvMapper"
        hideLastModifiedColumn
        :emptyBlock="{
          title: 'No team permissions yet',
          description: 'Create your first team to define and assign permissions to users.',
          createButtonLabel: 'Team',
          createPagePath: 'teams-permission/create',
          documentationService: documentationAccountsProducts.teamPermissions
        }"
      >
      </FetchListTableBlock>
    </template>
  </ContentBlock>
</template>
