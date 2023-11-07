<script>
  import ListTableBlock from '@/templates/list-table-block'

  export default {
    name: 'domains-view',
    components: {
      ListTableBlock
    },
    props: {
      listDomainsService: {
        required: true,
        type: Function
      },
      deleteDomainService: {
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
            field: 'digitalCertificateId',
            header: 'Digital Certificate'
          },
          {
            field: 'domainName',
            header: 'Domain Address'
          },
          {
            field: 'cnames',
            header: 'CNAME'
          },
          {
            field: 'edgeApplicationName',
            header: 'Edge Application'
          }
        ]
      }
    }
  }
</script>

<template>
  <ListTableBlock
    pageTitle="Domains"
    addButtonLabel="Add"
    createPagePath="domains/create"
    editPagePath="domains/edit"
    :listService="listDomainsService"
    :deleteService="deleteDomainService"
    :columns="getColumns"
  />
</template>
