<template>
  <ListTableBlock
    :listService="pros.listTeamPermissionService"
    :deleteService="pros.deleteTeamPermissionService"
    :columns="getColumns"
    pageTitle="Teams Permissions"
    addButtonLabel="Add Team"
    createPagePath="team-permission/create"
    editPagePath="team-permission/edit"
  >
  </ListTableBlock>
</template>

<script setup>
  import { defineProps, computed } from 'vue'
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
