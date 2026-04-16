<script setup>
  import { computed, inject } from 'vue'
  import { useRouter } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import ListTable from '@/components/list-table'
  import { DataTableActionsButtons } from '@/components/list-table'
  import { teamPermissionService } from '@/services/v2/team-permission'
  import { documentationAccountsProducts } from '@/helpers/azion-documentation-catalog'
  import { ref } from 'vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const router = useRouter()
  const listTableRef = ref()

  const handleNavigateToCreate = () => {
    router.push('teams-permission/create')
  }

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

  const emit = defineEmits(['on-load-data', 'on-before-go-to-add-page', 'on-before-go-to-edit'])
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
      <ListTable
        ref="listTableRef"
        :listService="teamPermissionService.list"
        :columns="getColumns"
        :actions="actions"
        editPagePath="/teams-permission/edit"
        defaultOrderingFieldName="name"
        :frozenColumns="['name']"
        exportFileName="Teams Permissions"
        :csvMapper="csvMapper"
        :lazy="true"
        emptyListMessage="No teams found."
        :hideLastModifiedColumn="true"
        :emptyBlock="{
          title: 'No team permissions yet',
          description: 'Create your first team to define and assign permissions to users.',
          createButtonLabel: 'Team',
          documentationService: documentationAccountsProducts.teamPermissions
        }"
        @click-to-create="handleNavigateToCreate"
        @on-load-data="emit('on-load-data', $event)"
        @on-before-go-to-add-page="handleTrackEventGoToCreate"
        @on-before-go-to-edit="handleTrackEventGoToEdit"
      />
    </template>
  </ContentBlock>
</template>
