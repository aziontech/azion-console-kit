<template>
  <ListTableBlock
    v-if="hasContentToList"
    :listService="listEdgeServicesService"
    :deleteService="deleteEdgeServicesService"
    :columns="getColumns"
    pageTitle="Edge Services"
    addButtonLabel="Add Service"
    createPagePath="edge-services/create"
    editPagePath="edge-services/edit"
    @on-load-data="handleLoadData"
  />

  <EmptyResultsBlock
    v-else
    title="No edge services"
    description="Create your first edge service."
    createButtonLabel="Add edge service"
    createPagePath="edge-services/create"
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
    name: 'edge-services-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration
    },
    props: {
      listEdgeServicesService: {
        required: true,
        type: Function
      },
      deleteEdgeServicesService: {
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
            field: 'lastEditor',
            header: 'Last Editor'
          },
          {
            field: 'lastModified',
            header: 'Last Modified'
          },
          {
            field: 'active',
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
