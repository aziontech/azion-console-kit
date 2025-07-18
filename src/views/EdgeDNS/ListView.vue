<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Edge DNS"
        description="Set Azion Edge DNS as the authoritative DNS server for a domain by copying the nameservers values."
      >
        <template #default>
          <copyBlock
            :value="nameServers"
            label="Copy Nameserver Values"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        addButtonLabel="Zone"
        createPagePath="edge-dns/create"
        editPagePath="edge-dns/edit"
        :listService="edgeDNSService.listEdgeDNSService"
        :columns="getColumns"
        :apiFields="EDGE_DNS_API_FIELDS"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        emptyListMessage="No zone found."
        data-testid="edge-dns-list-table-block"
        :actions="actions"
        :defaultOrderingFieldName="'name'"
      />
      <EmptyResultsBlock
        v-else
        title="No zone has been added"
        description="Click the button below to add your first zone."
        createButtonLabel="Zone"
        createPagePath="edge-dns/create"
        :documentationService="documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { ref, computed, inject } from 'vue'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { edgeDNSService } from '@/services/v2'
  import copyBlock from '@/templates/copy-block/copy-block.vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'edge-dns-view' })

  const props = defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const EDGE_DNS_API_FIELDS = ['id', 'name', 'domain', 'active']
  const hasContentToList = ref(true)
  const nameServers = ref('ns1.aziondns.net;ns2.aziondns.com;ns3.aziondns.org')
  const actions = [
    {
      type: 'delete',
      title: 'zone',
      icon: 'pi pi-trash',
      service: edgeDNSService.deleteEdgeDNSService
    }
  ]

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const handleTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Edge DNS Zone'
    })
  }
  const handleTrackEditEvent = () => {
    tracker.product.clickToEdit({
      productName: 'Edge DNS Zone'
    })
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },

      {
        field: 'domain',
        header: 'Domain',
        type: 'component',
        filterPath: 'domain.content',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-with-clipboard',
            dependencies: {
              copyContentService: props.clipboardWrite
            }
          })
        }
      },
      {
        field: 'active',
        header: 'Status',
        type: 'component',
        sortField: 'active',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      }
    ]
  })
</script>
