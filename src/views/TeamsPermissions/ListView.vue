<script setup>
  import ContentBlock from '@/templates/content-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { computed, inject } from 'vue'
  import { DataTableActionsButtons } from '@/components/DataTable'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    listTeamPermissionService: { required: true, type: Function },
    deleteTeamPermissionService: { required: true, type: Function },
    documentationService: { required: true, type: Function }
  })

  const TEAM_PERMISSIONS_API_FIELDS = ['id', 'name', 'permissions', 'is_active']

  const actions = [
    {
      label: 'Delete',
      type: 'delete',
      title: 'team',
      icon: 'pi pi-trash',
      service: props.deleteTeamPermissionService
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
        style: 'max-width: 300px',
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
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'text-array-with-popup' })
      },
      {
        field: 'status',
        header: 'Status',
        type: 'component',
        sortField: 'is_active',
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
        :listService="listTeamPermissionService"
        :columns="getColumns"
        editPagePath="/teams-permission/edit"
        emptyListMessage="No teams found."
        :actions="actions"
        @on-before-go-to-add-page="handleTrackEventGoToCreate"
        @on-before-go-to-edit="handleTrackEventGoToEdit"
        :apiFields="TEAM_PERMISSIONS_API_FIELDS"
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
          documentationService: documentationService
        }"
      >
      </FetchListTableBlock>
    </template>
  </ContentBlock>
</template>
