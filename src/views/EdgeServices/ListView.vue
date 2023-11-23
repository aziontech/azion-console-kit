<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Services"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listEdgeServicesService"
        :deleteService="deleteEdgeServicesService"
        :columns="getColumns"
        pageTitle="Edge Services"
        pageTitleDelete="Edge Service"
        addButtonLabel="Edge Services"
        createPagePath="edge-services/create"
        editPagePath="edge-services/edit"
        @on-load-data="handleLoadData"
      />

      <EmptyResultsBlock
        v-else
        pageTitle="Edge Services"
        title="No edge services added"
        description="Create your first edge service."
        createButtonLabel="Edge Services"
        createPagePath="edge-services/create"
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

  export default {
    name: 'edge-services-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration,
      PageHeadingBlock,
      ContentBlock
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
