<template>
  <ListTableBlock
    :listService="listIntelligentDNSService"
    :deleteService="deleteIntelligentDNSService"
    :columns="columns"
    pageTitle="Intelligent DNS"
    addButtonLabel="Add Intelligent DNS"
    createPagePath="intelligent-dns/create"
    editPagePath="intelligent-dns/edit"
  />
</template>

<script>
  import ListTableBlock from '@/templates/list-table-block'

  export default {
    name: 'intelligent-dns-view',
    components: {
      ListTableBlock
    },
    props: {
      listIntelligentDNSService: {
        required: true,
        type: Function
      },
      deleteIntelligentDNSService: {
        required: true,
        type: Function
      }
    },
    computed: {
      columns() {
        return [
          {
            field: 'name',
            header: 'Name'
          },
          {
            field: 'domain',
            header: 'Domain'
          },
          {
            field: 'isActive',
            header: 'Active'
          }
        ]
      }
    }
  }
</script>
