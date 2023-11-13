<template>
  <ListTableBlock
    v-if="hasContentToList"
    :listService="listVariablesService"
    :deleteService="deleteVariablesService"
    :columns="getColumns"
    pageTitle="Variables"
    addButtonLabel="Add Variable"
    createPagePath="variables/create"
    editPagePath="variables/edit"
    @on-load-data="handleLoadData"
  />
  <EmptyResultsBlock
    v-else
    pageTitle="Variables"
    title="No variables added"
    description="Create your first variable."
    createButtonLabel="Add variable"
    createPagePath="variables/create"
    :documentationService="documentationService"
  >
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>
</template>

<script>
  import ListTableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { h } from 'vue'

  export default {
    name: 'variables-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration
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
        type: Function
      },
      documentationService: {
        required: true,
        type: Function
      }
    },
    data: () => ({
      hasContentToList: true
    }),
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
            component: (columnData) => {
              if (columnData.isSecret) {
                return h('span', `${columnData.content}`)
              } else {
                return columnBuilder({
                  data: columnData,
                  columnAppearance: 'text-with-clipboard',
                  dependencies: {
                    copyContentService: this.clipboardWrite
                  }
                })
              }
            }
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
    },
    methods: {
      handleLoadData(event) {
        this.hasContentToList = event
      }
    }
  }
</script>
