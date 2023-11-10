<template>
  <ListTableBlock
    :listService="listNetworkListService"
    :deleteService="deleteNetworkListService"
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
    name: 'network-list-view',
    components: {
      ListTableBlock
    },
    props: {
      listNetworkListService: {
        required: true,
        type: Function
      },
      deleteNetworkListService: {
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
            field: 'listType',
            header: 'List Type'
          },
          {
            field: 'lastEditor',
            header: 'Last Editor'
          },
          {
            field: 'lastModified',
            header: 'Last Modified'
          }
        ]
      }
    }
  }
</script>
