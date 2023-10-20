<template>
  <ListTableBlock :listService="listVariablesService" :deleteService="deleteVariablesService" :columns="getColumns"
    pageTitle="Variables" addButtonLabel="Add Variable" createPagePath="variables/create" editPagePath="variables/edit" />
</template>

<script>
import ListTableBlock from '@/templates/list-table-block'
import { columnBuilder } from '@/templates/list-table-block/columns/column-builder';

export default {
  name: 'variables-view',
  components: {
    ListTableBlock
  },
  props: {
    listVariablesService: {
      required: true,
      type: Function
    },
    deleteVariablesService: {
      required: true,
      type: Function
    },
    clipboardWrite: {
      required: true,
      type: Function,
    }
  },
  computed: {
    getColumns() {
      return [
        {
          field: 'key',
          header: 'Key'
        },
        {
          field: 'value',
          header: 'Value',
          type: 'component',
          component: (columnData) => columnBuilder({
            data: columnData,
            columnAppearance: 'text-with-clipboard',
            dependencies: {
              copyContentService: this.clipboardWrite
            }
          })
        },
        {
          field: 'lastEditor',
          header: 'Last Editor'
        },
        {
          field: 'updatedAt',
          header: 'Last Update'
        }
      ]
    }
  }
}
</script>
