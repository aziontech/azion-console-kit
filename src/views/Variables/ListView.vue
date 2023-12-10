<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Variables" />
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listVariablesService"
        :deleteService="deleteVariablesService"
        :columns="getColumns"
        pageTitleDelete="Variable"
        addButtonLabel="Variable"
        createPagePath="variables/create"
        editPagePath="variables/edit"
        @on-load-data="handleLoadData"
      />
      <EmptyResultsBlock
        v-else
        title="No variables added"
        description="Create your first variable."
        createButtonLabel="Variable"
        createPagePath="variables/create"
        :documentationService="documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
  <button @click="handleToast()">Chama toast</button>
</template>

<script>
  import ListTableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  import { h } from 'vue'

  export default {
    name: 'variables-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration,
      ContentBlock,
      PageHeadingBlock
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
            sortField: 'updatedAtDate',
            header: 'Last Update'
          }
        ]
      }
    },
    methods: {
      handleLoadData(event) {
        this.hasContentToList = event
      },
      handleToast() {
        this.$toast.add({
          closable: true,
          severity: 'success',
          summary: 'Example Toast'
        })
        this.$toast.add({
          closable: true,
          severity: 'success',
          summary: 'Example Toast',
          detail:
            'Description. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam consectetur leo tortor (limited to 125 chracters)'
        })
        this.$toast.add({
          closable: true,
          severity: 'error',
          summary: 'Example Toast',
          detail:
            'Description. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam consectetur leo tortor (limited to 125 chracters)'
        })
        this.$toast.add({
          closable: true,
          severity: 'warn',
          summary: 'Example Toast',
          detail:
            'Description. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam consectetur leo tortor (limited to 125 chracters)',
          secondary: {
            label: 'Outlined',
            callback: ''
          },
          primary: {
            label: 'Primary',
            callback: ''
          }
        })
        this.$toast.add({
          closable: true,
          severity: 'info',
          summary: 'Example Toast',
          detail:
            'Description. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam consectetur leo tortor (limited to 125 chracters)',
          link: {
            label: 'Primary',
            callback: 'Link'
          }
        })
      }
    }
  }
</script>
