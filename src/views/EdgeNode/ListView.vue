<template>
  <ListTableBlock
    :listService="listEdgeNodeService"
    :columns="getColumns"
    pageTitle="Network Lists"
    addButtonLabel="Add Network List"
    createPagePath="network-lists/create"
    editPagePath="network-lists/edit"
  />
</template>
<script>
  import ListTableBlock from '@/templates/list-table-block'

  export default {
    name: 'edge-node-view',
    components: {
      ListTableBlock
    },
    props: {
      listEdgeNodeService: {
        required: true,
        type: Function
      }
    },
    computed: {
      getColumns() {
        return [
          {
            field: 'name',
            header: 'Name'
          },
          {
            field: 'hashId',
            header: 'HashID'
          },
          {
            field: 'groups',
            header: 'Group'
          },
          {
            field: 'status',
            header: 'Status'
          }
        ]
      }
    }
  }
</script>
