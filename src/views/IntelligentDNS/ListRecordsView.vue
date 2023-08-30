<template>
  <ListTableBlock
    :listService="listRecordsServiceIntelligentDNSDecorator"
    :columns="columns"
    :pageTitle="'Records'"
    :addButtonLabel="'Add Record'"
    :createPagePath="`records/create/:${meuID}`"
    :editPagePath="'records/edit'"
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
    listRecordsService: {
      required: true,
      type: Function
    }
    // deleteRecordsService: {
    //   required: true,
    //   type: Function,
    // },
  },
  data() {
    return {
      intelligentDNSID: undefined
    }
  },
  created() {
    this.intelligentDNSID = this.$route.params.id
  },
  methods: {
    async listRecordsServiceIntelligentDNSDecorator(payload) {
      return await this.listRecordsService({ ...payload, id: this.intelligentDNSID })
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
          field: 'type',
          header: 'Type'
        },
        {
          field: 'value',
          header: 'Value'
        },
        {
          field: 'ttl',
          header: 'TTL'
        },
        {
          field: 'policy',
          header: 'Policy'
        },
        {
          field: 'weight',
          header: 'Weight'
        },
        {
          field: 'description',
          header: 'Description'
        }
      ]
    }
  }
}
</script>
