<template>
  <ListTableBlock
    v-if="hasContentToList"
    :listService="listEdgeFunctionsService"
    :deleteService="deleteEdgeFunctionsService"
    :columns="getColumns"
    pageTitle="Edge Functions"
    addButtonLabel="Edge Functions"
    createPagePath="edge-functions/create"
    editPagePath="edge-functions/edit"
    @on-load-data="handleLoadData"
  />
  <EmptyResultsBlock
    v-else
    pageTitle="Edge Functions"
    title="No edge functions added"
    description="Create your first edge functions."
    createButtonLabel="Edge Functions"
    createPagePath="edge-functions/create"
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
    name: 'edge-functions-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration
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
            header: 'Name'
          },
          {
            field: 'version',
            header: 'Version'
          },
          {
            field: 'language',
            header: 'Language'
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
            header: 'Last Modified'
          },
          {
            field: 'referenceCount',
            header: 'Ref. Count'
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
