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
        let toastConfig = {
          closable: true,
          severity: 'success',
          summary: 'Authorize successfully',
          life: 10000
        }
        try {
          this.$toast.add({
            closable: true,
            severity: 'info',
            summary: 'Processing request',
            life: 5000
          })
          await this.authorizeEdgeNodeService(id)
        } catch (error) {
          toastConfig = {
            closable: true,
            severity: 'error',
            summary: error,
            life: 10000
          }
        } finally {
          this.$toast.add(toastConfig)
        }
      }
    }
  }
</script>
