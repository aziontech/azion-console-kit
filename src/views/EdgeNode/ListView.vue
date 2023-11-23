<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Nodes"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="false"
        :listService="listEdgeNodeService"
        :columns="getColumns"
        :deleteService="deleteEdgeNodeService"
        @authorizeEdgeNode="authorize = $event.authorize"
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
    </template>
    <Authorize :authorize="authorize" />
  </ContentBlock>

</template>
<script>
  import ListTableBlock from '@/templates/list-table-block/with-authorize'
  import EmptyEdgeNode from '@/templates/empty-results-block/empty-edge-node.vue'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  import Authorize from './Authorize'

  export default {
    name: 'edge-node-view',
    components: {
      ListTableBlock,
      Authorize,
      EmptyEdgeNode,
      Illustration,
      ContentBlock,
      PageHeadingBlock
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
