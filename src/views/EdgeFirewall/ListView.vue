<script setup>
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block/index.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, ref, inject } from 'vue'

  defineOptions({ name: 'edge-firewall-view' })

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */

  const tracker = inject('tracker')

  const props = defineProps({
    listEdgeFirewallService: {
      required: true,
      type: Function
    },
    deleteEdgeFirewallService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const hasContentToList = ref(true)
  const actions = [
    {
      type: 'delete',
      title: 'edge firewall',
      icon: 'pi pi-trash',
      service: props.deleteEdgeFirewallService
    }
  ]

  const getColumns = computed(() => [
    {
      field: 'name',
      header: 'Name'
    },
    {
      field: 'domainsList',
      header: 'Domains',
      filterPath: 'status.text',
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
    },
    {
      field: 'status',
      header: 'Status',
      sortField: 'status.content',
      filterPath: 'status.content',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      }
    },
    {
      field: 'lastEditor',
      header: 'Last Editor'
    },
    {
      field: 'lastModify',
      sortField: 'lastModifyDate',
      header: 'Last Modified'
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
      <PageHeadingBlock pageTitle="Edge Firewall"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        addButtonLabel="Edge Firewall"
        createPagePath="/edge-firewall/create"
        editPagePath="/edge-firewall/edit"
        :listService="listEdgeFirewallService"
        @on-before-go-to-edit="handleTrackEditEvent"
        :columns="getColumns"
        @on-load-data="handleLoadData"
        emptyListMessage="No edge firewall found."
        @on-before-go-to-add-page="handleTrackEvent"
        :actions="actions"
      />
      <EmptyResultsBlock
        v-else
        title="No edge firewall has been created."
        description="Click the button below to create your first edge firewall."
        createButtonLabel="Edge Firewall"
        createPagePath="/edge-firewall/create"
        :documentationService="props.documentationService"
        @click-to-create="handleTrackEvent"
      >
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>
