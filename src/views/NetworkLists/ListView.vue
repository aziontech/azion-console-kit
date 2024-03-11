<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Network Lists"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listNetworkListService"
        :deleteService="deleteNetworkListService"
        :columns="getColumns"
        pageTitleDelete="network list"
        addButtonLabel="Network List"
        createPagePath="network-lists/create"
        editPagePath="network-lists/edit"
        @on-load-data="handleLoadData"
        emptyListMessage="No network list found."
      />
      <EmptyResultsBlock
        v-else
        title="No network list added"
        description="Create a network list based on ASNs, countries, or IP addresses."
        createButtonLabel="Network"
        createPagePath="network-lists/create"
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
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  export default {
    name: 'network-list-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration,
      PageHeadingBlock,
      ContentBlock
    },
    props: {
      listNetworkListService: {
        required: true,
        type: Function
      },
      deleteNetworkListService: {
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
            field: 'listType',
            header: 'List Type'
          },
          {
            field: 'lastEditor',
            header: 'Last Editor'
          },
          {
            field: 'lastModified',
            sortField: 'lastModifiedDate',
            header: 'Last Modified'
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
