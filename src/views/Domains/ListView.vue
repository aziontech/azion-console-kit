<template>
  <ListTableBlock
    v-if="hasContentToList"
    pageTitle="Domains"
    pageTitleDelete="Domain"
    addButtonLabel="Domains"
    createPagePath="domains/create"
    editPagePath="domains/edit"
    :listService="listDomainsService"
    :deleteService="deleteDomainService"
    :columns="getColumns"
    @on-load-data="handleLoadData"
  />
  <EmptyResultsBlock
    v-else
    pageTitle="Domains"
    title="You don't have any Domain created"
    description="Create your first domain."
    createButtonLabel="Domains"
    createPagePath="domains/create"
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
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

  export default {
    name: 'domains-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration
    },
    props: {
      listDomainsService: {
        required: true,
        type: Function
      },
      deleteDomainService: {
        required: true,
        type: Function
      },
      documentationService: {
        required: true,
        type: Function
      },
      clipboardWrite: {
        required: true,
        type: Function
      }
    },
    data() {
      return {
        hasContentToList: true
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
            field: 'digitalCertificateId',
            header: 'Digital Certificate'
          },
          {
            field: 'domainName',
            header: 'Domain Name',
            type: 'component',
            component: (columnData) => {
              return columnBuilder({
                data: columnData,
                columnAppearance: 'text-with-clipboard',
                dependencies: {
                  copyContentService: this.clipboardWrite
                }
              })
            }
          },
          {
            field: 'cnames',
            header: 'CNAME'
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
          },
          {
            field: 'edgeApplicationName',
            header: 'Edge Application'
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
