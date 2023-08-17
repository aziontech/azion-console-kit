<script >
import ListTableBlock from '@/templates/list-table-block'

export default {
  name: 'variables-view',
  components: {
    ListTableBlock
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
  <ListTableBlock :listService="listVariablesService" :columns="[
    {
      field: 'key',
      header: 'Key'
    },
    {
      field: 'value',
      header: 'Value'
    },
  ]" :pageTitle="'Variables'" :addButtonLabel="'Add Variable'" :createPagePath="'/'"></ListTableBlock>
</template>

