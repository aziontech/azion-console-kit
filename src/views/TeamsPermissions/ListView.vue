<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Teams Permissions"
        data-testid="teams-permissions__list-view__page-heading"
      />
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listTeamPermissionService"
        :columns="getColumns"
        addButtonLabel="Team"
        createPagePath="teams-permission/create"
        editPagePath="teams-permission/edit"
        @on-load-data="handleLoadData"
        emptyListMessage="No teams found."
        :actions="actions"
      >
      </ListTableBlock>
      <EmptyResultsBlock
        v-else
        data-testid="teams-permissions__list-view__empty-results-block"
        title="No teams have been created"
        description="Click the button below to create your first team and add permissions."
        createButtonLabel="Team"
        createPagePath="teams-permission/create"
        :documentationService="documentationService"
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
  import ListTableBlock from '@/templates/list-table-block/action-column.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, ref } from 'vue'

  const props = defineProps({
    listTeamPermissionService: { required: true, type: Function },
    deleteTeamPermissionService: { required: true, type: Function },
    documentationService: { required: true, type: Function }
  })

  const hasContentToList = ref(true)
  const actions = [
    {
      type: 'delete',
      title: 'team',
      icon: 'pi pi-trash',
      service: props.deleteTeamPermissionService
    }
  ]

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'permissions',
        header: 'Permissions',
        type: 'component',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
      },
      {
        field: 'status',
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
</script>
