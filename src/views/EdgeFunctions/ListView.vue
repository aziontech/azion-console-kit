<template>
  <ListTableBlock
    :listService="listEdgeFunctionsService"
    :deleteService="deleteEdgeFunctionsService"
    :columns="[
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'version',
        header: 'Version'
      },
      {
        field: 'language',
        header: 'Language'
      },
      {
        field: 'initiatorType',
        header: 'Initiator Type'
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
        field: 'referenceCount',
        header: 'Ref. Count'
      },
      {
        field: 'active',
        header: 'Active'
      }
    ]"
    :pageTitle="'Edge Functions'"
    :addButtonLabel="'Add Edge Function'"
    :createPagePath="'edge-functions/create'"
    :editPagePath="'edge-functions/edit'"
  />
</template>

<script>
import ListTableBlock from '@/templates/list-table-block'

export default {
  name: 'edge-functions-view',
  components: {
    ListTableBlock
  },
  props: {
    listEdgeFunctionsService: {
      required: true,
      type: Function
    },
    deleteEdgeFunctionsService: {
      required: true,
      type: Function
    }
  }
}
</script>
