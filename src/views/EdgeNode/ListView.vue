<template>
  <ListTableBlock
    :listService="listEdgeNodeService"
    :columns="getColumns"
    :deleteService="deleteEdgeNodeService"
    pageTitle="Edge Nodes"
    addButtonLabel=""
    editPagePath="edge-node/edit"
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
      },
      deleteEdgeNodeService: {
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
