<template>
  <ListTableBlock
    v-if="hasContentToList"
    :listService="listIntelligentDNSService"
    :deleteService="deleteIntelligentDNSService"
    :columns="getColumns"
    pageTitle="Intelligent DNS"
    addButtonLabel="Add Intelligent DNS"
    createPagePath="intelligent-dns/create"
    editPagePath="intelligent-dns/edit"
    @on-load-data="handleLoadData"
  />
  <EmptyResultsBlock
    v-else
    title="No Intelligent DNS added"
    description="Create your first Intelligent DNS."
    createButtonLabel="Add Intelligent DNS"
    createPagePath="intelligent-dns/create"
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
    name: 'intelligent-dns-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration
    },
    data: () => ({
      hasContentToList: true
    }),
    props: {
      listIntelligentDNSService: {
        required: true,
        type: Function
      },
      deleteIntelligentDNSService: {
        required: true,
        type: Function
      },
      documentationService: {
        required: true,
        type: Function
      }
    },
    computed: {
      getColumns() {
        return [
          {
            field: 'name',
            header: 'Name'
          },
          {
            field: 'domain',
            header: 'Domain'
          },
          {
            field: 'isActive',
            header: 'Active'
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
