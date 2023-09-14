<template>
  <ListTableBlock
    :listService="listEdgeServicesService"
    :deleteService="deleteEdgeServicesService"
    :columns="getColumns"
    pageTitle="Edge Services"
    addButtonLabel="Add Service"
    createPagePath="edge-services/create"
    editPagePath="edge-services/edit"
  />
</template>

<script>
  import ListTableBlock from '@/templates/list-table-block'

  export default {
    name: 'edge-services-view',
    components: {
      ListTableBlock
    },
    props: {
      listEdgeServicesService: {
        required: true,
        type: Function
      },
      deleteEdgeServicesService: {
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
            field: 'lastEditor',
            header: 'Last Editor'
          },
          {
            field: 'lastModified',
            header: 'Last Modified'
          },
          {
            field: 'active',
            header: 'Active'
          }
        ]
      }
    }
  }
</script>
