<template>
    <ListTableBlock
      :listService="listNetworkListService"
      :deleteService="deleteNetworkListService"
      :columns="[
        {
          field: 'name',
          header: 'Name'
        },
        {
          field: 'listType',
          header: 'List type'
        },
        {
          field: 'lastEditor',
          header: 'Last editor'
        },
        {
          field: 'lastModified',
          header: 'Last modified'
        },
      ]"
      :pageTitle="'Network List'"
      :addButtonLabel="'Add Network List'"
      :createPagePath="'network-list/create'"
      :editPagePath="'network-list/edit'"
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
        type: Function,
      },
      deleteNetworkListService: {
        required: true,
        type: Function,
      },
    }
  }
  </script>
  