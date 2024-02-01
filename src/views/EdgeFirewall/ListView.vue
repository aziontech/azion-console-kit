<script setup>
  import Illustration from '@/assets/svg/illustration-layers'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, ref } from 'vue'
  defineOptions({ name: 'edge-firewall-view' })

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
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Firewall"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        pageTitleDelete="Edge Firewal"
        addButtonLabel="Rule Set"
        createPagePath="/edge-firewall/create"
        editPagePath="/edge-firewall/edit"
        :listService="props.listEdgeFirewallService"
        :deleteService="props.deleteEdgeFirewallService"
        :columns="getColumns"
        @on-load-data="handleLoadData"
        emptyListMessage="No Rule Set found."
      />
      <EmptyResultsBlock
        v-else
        title="No Rule Set added."
        description="Create your first Rule Set."
        createButtonLabel="Rule Set"
        createPagePath="/edge-firewall/create"
        :documentationService="props.documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>
