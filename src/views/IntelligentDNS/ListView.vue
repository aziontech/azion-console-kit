<template>
  <ListTableBlock
    :listService="listIntelligentDNSService"
    :deleteService="deleteIntelligentDNSService"
    :columns="[
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
      },
    ]"
    :pageTitle="'Intelligent DNS'"
    :addButtonLabel="'Add Intelligent DNS'"
    :createPagePath="'intelligent/dns/create'"
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
      type: Function,
    },
    deleteIntelligentDNSService: {
      required: true,
      type: Function,
    },
  }
}
</script>
