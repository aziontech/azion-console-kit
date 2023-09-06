<script>
  import ListTableBlock from '@/templates/list-table-block'

  export default {
    name: 'edge-firewall-view',
    components: {
      ListTableBlock
    },
    props: {
      listEdgeFirewallService: {
        required: true,
        type: Function
      },
      deleteEdgeFirewallService: {
        required: true,
        type: Function
      }
    }
  }
</script>

<template>
  <ListTableBlock
    pageTitle="Edge Firewall"
    addButtonLabel="Add Rule Set"
    createPagePath="/edge-firewall/create"
    editPagePath="/edge-firewall/edit"
    :listService="listEdgeFirewallService"
    :deleteService="deleteEdgeFirewallService"
    :columns="[
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
    ]"
  ></ListTableBlock>
</template>
