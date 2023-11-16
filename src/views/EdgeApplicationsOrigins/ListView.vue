<script>
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'

  export default {
    name: 'origins-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration
    },
    props: {
      listOriginsService: {
        required: true,
        type: Function
      },
      deleteOriginsService: {
        required: true,
        type: Function
      },
      documentationService: {
        required: true,
        type: Function
      }
    },
    data: () => ({
      hasContentToList: true
    }),
    methods: {
      handleLoadData(event) {
        this.hasContentToList = event
      },
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
    v-if="hasContentToList"
    pageTitle="Origins"
    addButtonLabel="Add origins"
    :createPagePath="`${edgeApplicationId}/origins/create`"
    :editPagePath="`${edgeApplicationId}/origins/edit`"
    pathIdField="originKey"
    :listService="listOrigins"
    :deleteService="deleteOrigin"
    :columns="getColumns"
    @on-load-data="handleLoadData"
  />
  <EmptyResultsBlock
    v-else
    pageTitle="Origins"
    title="No origins added"
    description="Create your first origins."
    createButtonLabel="Origins"
    :createPagePath="`${edgeApplicationId}/origins/create`"
    :documentationService="documentationService"
  >
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>
</template>
