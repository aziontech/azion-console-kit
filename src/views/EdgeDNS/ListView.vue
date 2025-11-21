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

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name',
        type: 'component',
        style: 'max-width: 240px',
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
        description="Set Azion Edge DNS as the authoritative DNS server for a domain by copying the nameservers values."
      >
        <template #default>
          <div class="flex justify-between gap-2 w-full">
            <div class="flex gap-2">
              <copyBlock
                :value="nameServers"
                label="Copy Nameserver Values"
              />
              <DataTableActionsButtons
                size="small"
                label="Zone"
                @click="handleTrackEvent"
                createPagePath="edge-dns/create"
                data-testid="create_Zone_button"
              />
            </div>
          </div>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        createPagePath="edge-dns/create"
        editPagePath="edge-dns/edit"
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
        :emptyBlock="{
          title: 'No zone has been added',
          description: 'Click the button below to add your first zone.',
          createButtonLabel: 'Zone',
          createPagePath: 'edge-dns/create',
          documentationService: documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
