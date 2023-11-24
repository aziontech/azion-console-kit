<template>
  <ListTableBlock
    v-if="hasContentToList"
    :listService="listNetworkListService"
    :deleteService="deleteNetworkListService"
    :columns="getColumns"
    pageTitle="Network Lists"
    pageTitleDelete="Network List"
    addButtonLabel="Network List"
    createPagePath="network-lists/create"
    editPagePath="network-lists/edit"
    @on-load-data="handleLoadData"
  />
  <EmptyResultsBlock
    v-else
    pageTitle="Network Lists"
    title="No network list added"
    description="Create a network list based on ASNs, countries, or IP addresses."
    createButtonLabel="Add"
    createPagePath="network-lists/create"
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

  export default {
    name: 'network-list-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration
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
