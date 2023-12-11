<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Teams Permissions"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="pros.listTeamPermissionService"
        :deleteService="pros.deleteTeamPermissionService"
        :columns="getColumns"
        pageTitleDelete="Team Permission"
        addButtonLabel="Add"
        createPagePath="teams-permission/create"
        editPagePath="teams-permission/edit"
        @on-load-data="handleLoadData"
      >
      </ListTableBlock>
      <EmptyResultsBlock
        v-else
        title="No teams permissions has been created"
        description="Click the button below to initiate the setup process and create your teams permissions."
        createButtonLabel="Add"
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
  import { computed, ref } from 'vue'
  import ListTableBlock from '@/templates/list-table-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  const pros = defineProps({
    listTeamPermissionService: { required: true, type: Function },
    deleteTeamPermissionService: { required: true, type: Function },
    documentationService: { required: true, type: Function }
  })
  const hasContentToList = ref(true)

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
