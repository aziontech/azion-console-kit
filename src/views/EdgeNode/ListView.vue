<template>
  <div class="w-full">
    <ListTableBlock
      :listService="listEdgeNodeService"
      :columns="getColumns"
      :deleteService="deleteEdgeNodeService"
      @authorizeEdgeNode="authorize = $event.authorize"
      pageTitle="Edge Nodes"
      addButtonLabel=""
      editPagePath="edge-node/edit"
    />
  </div>
  <Authorize :authorize="authorize" />
</template>
<script>
  import ListTableBlock from '@/templates/list-table-block/with-authorize'
  import Authorize from './Authorize'

  export default {
    name: 'edge-node-view',
    components: {
      ListTableBlock,
      Authorize
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
    data() {
      return {
        authorize: {}
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
