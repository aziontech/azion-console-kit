<template>
  <ListTableBlock
    :listService="listVariablesService"
    :deleteService="deleteVariablesService"
    :columns="getColumns"
    pageTitle="Variables"
    addButtonLabel="Add Variable"
    createPagePath="variables/create"
    editPagePath="variables/edit"
  />
</template>

<script>
  import ListTableBlock from '@/templates/list-table-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

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
      }
    },
    computed: {
      getColumns() {
        return [
          {
            field: 'key',
            header: 'Text'
          },
          {
            field: 'updatedAt',
            header: 'clickable text',
            type: 'component',
            component: (columnData) =>
              columnBuilder({
                data: columnData,
                columnAppearance: 'clickable-text',
                dependencies: {
                  clickAction: async () => this.$router.push('/')
                }
              })
          },
          {
            field: 'updatedAt',
            header: 'text+clipboard',
            type: 'component',
            component: (columnData) =>
              columnBuilder({
                data: columnData,
                columnAppearance: 'text-with-clipboard',
                dependencies: {
                  copyContentService: async (text) => await navigator.clipboard.writeText(text)
                }
              })
          },
          {
            field: 'updatedAt',
            header: 'Tooltip+avatar+text',
            type: 'component',
            component: (data) =>
              columnBuilder({ data, columnAppearance: 'avatar-with-text-and-tooltip' })
          },
          {
            field: 'updatedAt',
            header: 'avatar+text',
            type: 'component',
            component: (data) => columnBuilder({ data, columnAppearance: 'avatar-with-text' })
          },
          {
            field: 'value',
            header: 'tag',
            type: 'component',
            component: (data) => columnBuilder({ data, columnAppearance: 'tag' })
          }
          // {
          //   field: 'updatedAt',
          //   header: 'Last Update',
          //   type: 'component',
          //   component: (data) => withDirectives(
          //     h(PrimeBadge, {
          //       value: data.timeDifference,
          //       severity: data.indicator,
          //       onClick: () => window.alert(JSON.stringify(data))
          //     }), [[
          //       resolveDirective('tooltip'),
          //       {
          //         value: data.editor,
          //       },
          //       null,
          //       { bottom: true }
          //     ]]
          //   ),
          // }
        ]
      }
    }
  }
</script>
