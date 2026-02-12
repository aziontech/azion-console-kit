<script setup>
  import { ref, computed, inject } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { edgeDNSService } from '@/services/v2/edge-dns/edge-dns-service'
  import { DataTableActionsButtons } from '@/components/DataTable'
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

  const EDGE_DNS_API_FIELDS = ['id', 'name', 'domain', 'active', 'last_modified']
  const nameServers = ref('ns1.aziondns.net;ns2.aziondns.com;ns3.aziondns.org')
  const actions = [
    {
      label: 'Delete',
      type: 'delete',
      title: 'zone',
      icon: 'pi pi-trash',
      service: edgeDNSService.deleteEdgeDNSService
    }
  ]

  const handleTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Edge DNS Zone'
    })
  }
  const handleTrackEditEvent = () => {
    tracker.product.clickToEdit({
      productName: 'Edge DNS'
    })
  }

  const csvMapper = (rowData) => {
    return {
      name: rowData.name,
      id: rowData.id,
      domain: rowData.data?.content || rowData.domain,
      active: rowData.data?.content || rowData.active
    }
  }

  const getFilters = computed(() => {
    return getColumns.value.filter((column) => column.field !== 'active')
  })

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name',
        type: 'component',
        style: 'max-width: 300px',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-format-with-popup'
          })
        }
      },
      {
        field: 'id',
        header: 'ID',
        sortField: 'id',
        filterPath: 'id'
      },
      {
        field: 'domain',
        header: 'Domain',
        type: 'component',
        filterPath: 'domain.content',
        component: (columnData) => {
          return columnBuilder({
            data: columnData.content,
            columnAppearance: 'text-format-with-popup',
            dependencies: {
              showCopy: () => props.clipboardWrite(columnData.content)
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

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Zones"
        description="Host authoritative DNS zones and serve authoritative DNS responses used to resolve domain names."
      >
        <template #default>
          <copyBlock
            :value="nameServers"
            is-copy-visible="true"
            label="Copy Nameserver Values"
          />
          <DataTableActionsButtons
            size="small"
            label="Zone"
            @click="handleTrackEvent"
            createPagePath="edge-dns/create"
            data-testid="create_Zone_button"
            :documentation-service="documentationService"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        createPagePath="edge-dns/create"
        editPagePath="/edge-dns/edit"
        :listService="edgeDNSService.listEdgeDNSService"
        :columns="getColumns"
        :apiFields="EDGE_DNS_API_FIELDS"
        @on-before-go-to-add-page="handleTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        emptyListMessage="No zone found."
        data-testid="edge-dns-list-table-block"
        :actions="actions"
        :defaultOrderingFieldName="'-last_modified'"
        :frozen-columns="['name']"
        exportFileName="Edge DNS"
        hideLastModifiedColumn
        :csvMapper="csvMapper"
        :allowedFilters="getFilters"
        :emptyBlock="{
          title: 'No DNS Zones yet',
          description:
            'Create your first DNS zone to host authoritative records and control domain name resolution.',
          createButtonLabel: 'Zone',
          createPagePath: 'edge-dns/create',
          documentationService: documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
