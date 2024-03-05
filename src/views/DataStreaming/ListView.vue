<script>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'

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
            header: 'Source'
          },
          {
            field: 'templateName',
            header: 'Template'
          },
          {
            field: 'endpointType',
            header: 'Connector'
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
      <PageHeadingBlock pageTitle="Data Streaming" />
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        addButtonLabel="Add"
        createPagePath="/data-streaming/create"
        editPagePath="/data-streaming/edit"
        pageTitleDelete="stream"
        :listService="listDataStreamingService"
        :deleteService="deleteDataStreamingService"
        :columns="getColumns"
        @on-load-data="handleLoadData"
        emptyListMessage="No stream has been created."
      ></ListTableBlock>
      <EmptyResultsBlock
        v-else
        title="No stream has been created"
        description="Click the button below to initiate the setup process and create your first stream."
        createButtonLabel="Add"
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
