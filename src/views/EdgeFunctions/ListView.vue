<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Functions" />
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listEdgeFunctionsService"
        :deleteService="deleteEdgeFunctionsService"
        :columns="getColumns"
        pageTitleDelete="Edge Function"
        addButtonLabel="Edge Function"
        createPagePath="edge-functions/create"
        editPagePath="edge-functions/edit"
        @on-load-data="handleLoadData"
      />
      <EmptyResultsBlock
        v-else
        title="No Functions added"
        description="Create your first function here."
        createButtonLabel="Edge Function"
        createPagePath="edge-functions/create"
        :documentationService="documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>

<script>
  import ListTableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

  export default {
    name: 'edge-functions-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration,
      ContentBlock,
      PageHeadingBlock
    },
    props: {
      listEdgeFunctionsService: {
        required: true,
        type: Function
      },
      deleteEdgeFunctionsService: {
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
            field: 'name',
            header: 'Name',
            type: 'component',
            component: (columnData) => {
              return columnBuilder({
                data: columnData,
                columnAppearance: 'text-with-tag'
              })
            }
          },
          {
            field: 'version',
            header: 'Version'
          },
          {
            field: 'referenceCount',
            header: 'Ref. Count'
          },
          {
            field: 'language',
            header: 'Language',
            type: 'component',
            component: (columnData) => {
              return columnBuilder({
                data: columnData,
                columnAppearance: 'language-icon-with-text'
              })
            }
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
            sortField: 'lastModifiedDate',
            header: 'Last Modified'
          },
          {
            field: 'status',
            header: 'Status',
            type: 'component',
            component: (columnData) => {
              return columnBuilder({
                data: columnData,
                columnAppearance: 'tag'
              })
            }
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
