<template>
  <div class="w-full">
    <ListTableBlock
      v-if="hasContentToList"
      :listService="listEdgeNodeService"
      :columns="getColumns"
      :deleteService="deleteEdgeNodeService"
      @authorizeEdgeNode="authorize = $event.authorize"
      pageTitle="Edge Nodes"
      pageTitleDelete="Edge Node"
      addButtonLabel=""
      editPagePath="edge-node/edit"
      @on-load-data="handleLoadData"
    />
    <EmptyEdgeNode
      v-else
      pageTitle="Edge Nodes"
      :documentationService="documentationService"
    >
      <template #illustration>
        <Illustration />
      </template>
    </EmptyEdgeNode>
  </div>
  <Authorize :authorize="authorize" />
</template>
<script>
  import ListTableBlock from '@/templates/list-table-block/with-authorize'
  import EmptyEdgeNode from '@/templates/empty-results-block/empty-edge-node.vue'
  import Illustration from '@/assets/svg/illustration-layers.vue'

  import Authorize from './Authorize'

  export default {
    name: 'edge-node-view',
    components: {
      ListTableBlock,
      Authorize,
      EmptyEdgeNode,
      Illustration
    },
    props: {
      listEdgeNodeService: {
        required: true,
        type: Function
      },
      deleteEdgeNodeService: {
        required: true,
        type: Function
      },
      documentationService: {
        required: true,
        type: Function
      }
    },
    data() {
      return {
        authorize: {},
        hasContentToList: true
      }
    },
    computed: {
      getColumns() {
        return [
          {
            field: 'name',
            header: 'Name'
          },
          {
            field: 'hashId',
            header: 'HashID'
          },
          {
            field: 'groups',
            header: 'Group'
          },
          {
            field: 'status',
            header: 'Status'
          }
        ]
      }
    },
    methods: {
      handleLoadData(event) {
        this.hasContentToList = event
      }
    }
  }
</script>
