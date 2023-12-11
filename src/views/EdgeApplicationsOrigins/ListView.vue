<script>
  import ListTableBlock from '@/templates/list-table-block/no-header'

  export default {
    name: 'origins-view',
    components: {
      ListTableBlock
    },
    props: {
      listOriginsService: {
        required: true,
        type: Function
      },
      deleteOriginsService: {
        required: true,
        type: Function
      }
    },
    methods: {
      async listOrigins() {
        return await this.listOriginsService({ id: this.edgeApplicationId })
      },
      async deleteOrigin(originKey) {
        return await this.deleteOriginsService(originKey, this.edgeApplicationId)
      }
    },
    computed: {
      getColumns() {
        return [
          {
            field: 'name',
            header: 'Origin Name'
          },
          {
            field: 'originType',
            header: 'Origin Type'
          },
          {
            field: 'hostHeader',
            header: 'Host Header'
          },
          {
            field: 'addresses',
            header: 'Origin Address'
          },
          {
            field: 'originKey',
            header: 'Origin Key'
          }
        ]
      },
      edgeApplicationId() {
        return this.$route.params.id
      }
    }
  }
</script>

<template>
  <ListTableBlock
    pageTitleDelete="Origin"
    addButtonLabel="Add origins"
    :createPagePath="`${edgeApplicationId}/origins/create`"
    :editPagePath="`${edgeApplicationId}/origins/edit`"
    pathIdField="originKey"
    :listService="listOrigins"
    :deleteService="deleteOrigin"
    :columns="getColumns"
  />
</template>
