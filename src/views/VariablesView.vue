<script >
import ListTemplate from '@/templates/list-template'

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
  <ListTemplate :listService="listVariablesService" :columns="[
    {
      field: 'key',
      header: 'Key'
    },
    {
      field: 'value',
      header: 'Value'
    },
  ]"></ListTemplate>
</template>

