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
          field: 'list_type',
          header: 'List type'
        },
        {
          field: 'last_editor',
          header: 'Last editor'
        },
        {
          field: 'last_modified',
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
  