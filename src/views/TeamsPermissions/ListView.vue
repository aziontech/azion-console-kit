<template>
  <ListTableBlock
    v-if="hasContentToList"
    :listService="pros.listTeamPermissionService"
    :deleteService="pros.deleteTeamPermissionService"
    :columns="getColumns"
    pageTitle="Teams Permissions"
    pageTitleDelete="Team Permission"
    addButtonLabel="Add"
    createPagePath="teams-permission/create"
    editPagePath="teams-permission/edit"
    @on-load-data="handleLoadData"
  >
  </ListTableBlock>
  <EmptyResultsBlock
    v-else
    pageTitle="Team Permissions"
    title="No team permissions added"
    description="Create your first team permission."
    createButtonLabel="Team Permissions"
    createPagePath="teams-permission/create"
    :documentationService="documentationService"
  >
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import ListTableBlock from '@/templates/list-table-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'

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
        field: 'isActive',
        header: 'Active'
      }
    ]
  })
</script>
