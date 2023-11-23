<script>
  import ListTableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  export default {
    name: 'edge-firewall-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration,
      ContentBlock,
      PageHeadingBlock
    },
    props: {
      listEdgeFirewallService: {
        required: true,
        type: Function
      },
      deleteEdgeFirewallService: {
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
            header: 'Last Modified'
          },
          {
            field: 'domainsList',
            header: 'Domains'
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

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Firewall"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        pageTitleDelete="Edge Firewal"
        addButtonLabel="Edge Firewall"
        createPagePath="/edge-firewall/create"
        editPagePath="/edge-firewall/edit"
        :listService="listEdgeFirewallService"
        :deleteService="deleteEdgeFirewallService"
        :columns="getColumns"
        @on-load-data="handleLoadData"
      />
      <EmptyResultsBlock
        v-else
        pageTitle="Edge Firewall"
        title="No edge firewall added"
        description="Create your first edge firewall."
        createButtonLabel="Edge Firewall"
        createPagePath="/edge-firewall/create"
        :documentationService="documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>
