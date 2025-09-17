<script setup>
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import CloneEdgeFirewall from './Dialog/Clone.vue'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { computed, ref, inject } from 'vue'
  import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'

  defineOptions({ name: 'edge-firewall-view' })

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */

  const tracker = inject('tracker')
  const EDGE_FIREWALL_API_FIELDS = [
    'id',
    'name',
    'debug_rules',
    'last_editor',
    'last_modified',
    'last_modify',
    'active'
  ]

  const props = defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const hasContentToList = ref(true)
  const actions = [
    {
      type: 'dialog',
      label: 'Clone',
      icon: 'pi pi-fw pi-copy',
      dialog: {
        component: CloneEdgeFirewall,
        body: (item) => ({
          data: item
        })
      }
    },
    {
      label: 'Delete',
      type: 'delete',
      title: 'Firewall',
      icon: 'pi pi-trash',
      service: edgeFirewallService.deleteEdgeFirewallService
    }
  ]

  const getColumns = computed(() => [
    {
      field: 'id',
      header: 'ID',
      sortField: 'id',
      filterPath: 'id'
    },
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
      sortField: 'last_modified',
      header: 'Last Modified'
    },
    {
      field: 'active',
      header: 'Status',
      sortField: 'active',
      filterPath: 'active',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      }
    }
  ])

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const handleTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Edge Firewall'
    })
  }

  const handleTrackEditEvent = () => {
    tracker.product.clickToEdit({
      productName: 'Edge Firewall'
    })
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Firewall"></PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        addButtonLabel="Firewall"
        createPagePath="/edge-firewall/create"
        editPagePath="/edge-firewall/edit"
        :listService="edgeFirewallService.listEdgeFirewallService"
        @on-before-go-to-edit="handleTrackEditEvent"
        :columns="getColumns"
        @on-load-data="handleLoadData"
        emptyListMessage="No Firewall found."
        @on-before-go-to-add-page="handleTrackEvent"
        :actions="actions"
        :apiFields="EDGE_FIREWALL_API_FIELDS"
        :defaultOrderingFieldName="'-last_modified'"
      />
      <EmptyResultsBlock
        v-else
        title="No Firewall has been created."
        description="Click the button below to create your first Firewall."
        createButtonLabel="Firewall"
        createPagePath="/edge-firewall/create"
        :documentationService="props.documentationService"
        @click-to-create="handleTrackEvent"
      >
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>
