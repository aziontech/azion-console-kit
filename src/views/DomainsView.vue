<script >
import ListTemplate from '@/templates/list-template'

export default {
  name: 'domains-view',
  components: {
    ListTemplate
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
  <ListTemplate :pageTitle="'Domains'" :addButtonLabel="'Add domains'" :listService="listDomainsService" :columns="[
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
  ]"></ListTemplate>
</template>

