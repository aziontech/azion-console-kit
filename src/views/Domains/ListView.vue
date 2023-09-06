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
      deleteDomainsService: {
        required: true,
        type: Function
      }
    }
  }
</script>

<template>
  <ListTableBlock
    pageTitle="Domains"
    addButtonLabel="Add domains"
    createPagePath="domains/create"
    editPagePath="domains/edit"
    :listService="listDomainsService"
    :deleteService="deleteDomainsService"
    :columns="[
      {
        field: 'domainName',
        header: 'Name'
      },
      {
        field: 'digitalCertificateId',
        header: 'Digital Certificate'
      },
      {
        field: 'domainName',
        header: 'Domain Name'
      },
      {
        field: 'cnames',
        header: 'CNAME'
      },
      {
        field: 'edgeApplicationName',
        header: 'Edge Application'
      }
    ]"
  ></ListTableBlock>
</template>
