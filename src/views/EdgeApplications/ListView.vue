<script>
  import ListTableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'

  export default {
    name: 'edge-application-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration
    },
    props: {
      listEdgeApplicationsService: {
        required: true,
        type: Function
      },
      deleteEdgeApplicationService: {
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
            field: 'lastModify',
            sortField: 'lastModifyDate',
            header: 'Last Modified'
          },
          {
            field: 'active',
            header: 'Active'
          },
          {
            field: 'debugRules',
            header: 'Debug rules'
          },
          {
            field: 'origins',
            header: 'Origins'
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
  <ListTableBlock
    v-if="hasContentToList"
    pageTitle="Edge Applications"
    pageTitleDelete="Edge Application"
    addButtonLabel="Edge Application"
    createPagePath="/edge-applications/create"
    editPagePath="/edge-applications/edit"
    :listService="listEdgeApplicationsService"
    :deleteService="deleteEdgeApplicationService"
    :columns="getColumns"
    @on-load-data="handleLoadData"
  />
  <EmptyResultsBlock
    v-else
    pageTitle="Edge Application"
    title="No edge application added"
    description="Create your first edge application."
    createButtonLabel="Edge Application"
    createPagePath="/edge-applications/create"
    :documentationService="documentationService"
  >
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>
</template>
