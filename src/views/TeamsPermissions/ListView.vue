<template>
  <ListTableBlock
    :listService="pros.listTeamPermissionService"
    :deleteService="pros.deleteTeamPermissionService"
    :columns="getColumns"
    pageTitle="Teams Permissions"
    addButtonLabel="Add Team"
    createPagePath="teams-permission/create"
    editPagePath="teams-permission/edit"
  >
  </ListTableBlock>
</template>

<script setup>
  import { computed } from 'vue'
  import ListTableBlock from '@/templates/list-table-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

  const pros = defineProps({
    listTeamPermissionService: { required: true, type: Function },
    deleteTeamPermissionService: { required: true, type: Function }
  })

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Team'
      },
      {
        field: 'permissions',
        header: 'Permission',
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
