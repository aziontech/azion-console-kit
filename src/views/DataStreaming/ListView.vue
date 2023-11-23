<script>
  import ListTableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

  export default {
    name: 'data-streaming-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration,
      ContentBlock,
      PageHeadingBlock
    },
    props: {
      listDataStreamingService: {
        required: true,
        type: Function
      },
      deleteDataStreamingService: {
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
            header: 'Name'
          },
          {
            field: 'dataSource',
            header: 'Data Source'
          },
          {
            field: 'templateName',
            header: 'Template'
          },
          {
            field: 'endpointType',
            header: 'Endpoint Type'
          },
          {
            field: 'active',
            header: 'Status',
            type: 'component',
            component: (columnData) =>
              columnBuilder({
                data: columnData,
                columnAppearance: 'tag'
              })
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

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Data Streaming"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        pageTitleDelete="Data Streaming"
        addButtonLabel="Data Streaming"
        createPagePath="/data-streaming/create"
        editPagePath="/data-streaming/edit"
        :listService="listDataStreamingService"
        :deleteService="deleteDataStreamingService"
        :columns="getColumns"
        @on-load-data="handleLoadData"
      ></ListTableBlock>
      <EmptyResultsBlock
        v-else
        title="No data streaming added"
        description="Create your first data streaming."
        createButtonLabel="Data Streaming"
        createPagePath="data-streaming/create"
        :documentationService="documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>
