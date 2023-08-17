<script >
import ListTemplate from '@/templates/list-table-block'

export default {
  name: 'variables-view',
  components: {
    ListTemplate
  },
  props: {
    listVariablesService: {
      required: true,
      type: Function,
    }
  }
}
</script>

<template>
  <ListTemplate :listService="listVariablesService"
  :columns="[
    {
      field: 'key',
      header: 'Key'
    },
    {
      field: 'value',
      header: 'Value'
    },
    {
      field: 'lastEditor',
      header: 'Last Editor'
    },
    {
      field: 'updatedAt',
      header: 'Last Update'
    },
  ]" 
  :pageTitle="'Variables'"
  :addButtonLabel="'Add Variable'" :createPagePath="'variables/create'"
  />
</template>

