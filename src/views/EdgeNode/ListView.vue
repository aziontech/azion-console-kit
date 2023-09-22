<template>
  <div>
    <ListTableBlock
      :listService="listEdgeNodeService"
      :columns="getColumns"
      :deleteService="deleteEdgeNodeService"
      :authorizeNode="true"
      pageTitle="Edge Nodes"
      addButtonLabel=""
      createPagePath="network-lists/create"
      editPagePath="network-lists/edit"
      @authorize="authorizeEdgenode"
    />
  </div>
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
      },
      authorizeEdgeNodeService: {
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
    },
    methods: {
      async authorizeEdgenode(id) {
        await this.authorizeEdgeNodeService(id)
      }
    }
  }
</script>
