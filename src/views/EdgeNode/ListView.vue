<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Nodes"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listEdgeNodeService"
        :columns="getColumns"
        :deleteService="deleteEdgeNodeService"
        @authorizeEdgeNode="authorizeEdgeNode"
        pageTitleDelete="Edge Node"
        addButtonLabel=""
        editPagePath="edge-node/edit"
        @on-load-data="handleLoadData"
      />
      <EmptyEdgeNode
        v-else
        :documentationService="documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyEdgeNode>
    </template>
  </ContentBlock>
</template>
<script>
  import ListTableBlock from '@/templates/list-table-block/with-authorize'
  import EmptyEdgeNode from '@/templates/empty-results-block/empty-edge-node.vue'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import * as EdgeNodeService from '@/services/edge-node-services'

  export default {
    name: 'edge-node-view',
    components: {
      ListTableBlock,
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
      },
      getAuthorize() {
        return this.authorize
      }
    },
    methods: {
      handleLoadData(event) {
        this.hasContentToList = event
      },
      async authorizeEdgeNode({ authorize }) {
        try {
          this.$toast.add({
            closable: false,
            severity: 'info',
            summary: 'Processing request',
            life: 2000
          })
          await EdgeNodeService.authorizeEdgeNodeService(authorize.edgeNodeID)
        } catch (error) {
          this.$toast.add({
            closable: false,
            severity: 'error',
            summary: error,
            life: 10000
          })
        } finally {
          this.$toast.add({
            closable: false,
            severity: 'success',
            summary: 'Edge Nodes authorized successfully!',
            life: 10000
          })
          this.authorizeDialogVisible = false
        }
      }
    }
  }
</script>
