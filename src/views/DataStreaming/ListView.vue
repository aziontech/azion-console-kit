<script >
import ListTableBlock from '@/templates/list-table-block'

export default {
  name: 'data-streaming-view',
  components: {
    ListTableBlock
  },
  props: {
    listDataStreamingService: {
      required: true,
      type: Function,
    }
  }
}
</script>

<template>
  <ListTableBlock 
    :pageTitle="'Data Streaming'" 
    :addButtonLabel="'Add Streaming'" 
    :createPagePath="'/data-streaming/create'"
    :editPagePath="'/data-streaming/edit'" 
    :listService="listDataStreamingService" 
    :columns="[
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'dataSource',
        header: 'Data Source'
      },
      {
        field: 'templateName',
        header: 'Template'
      },
      {
        field: 'active',
        header: 'Active'
      },
    ]"></ListTableBlock>
</template>

