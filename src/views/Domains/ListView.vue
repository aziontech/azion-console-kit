<script >
import ListTableBlock from '@/templates/list-table-block'

export default {
  name: 'domains-view',
  components: {
    ListTableBlock
  },
  props: {
    listDomainsService: {
      required: true,
      type: Function,
    }
  }
}
</script>

<template>
  <ListTableBlock :pageTitle="'Domains'" :addButtonLabel="'Add domains'" :listService="listDomainsService" :columns="[
    {
      field: 'name',
      header: 'Name'
    },
    {
      field: 'edgeCertificate',
      header: 'Certificates'
    },
    {
      field: 'domainName',
      header: 'Domain'
    },
    {
      field: 'cname',
      header: 'CNAME'
    },
    {
      field: 'edgeApplication',
      header: 'Edge Application'
    },
  ]"></ListTableBlock>
</template>

