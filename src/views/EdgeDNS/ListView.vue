<script setup>
  import { ref, computed, inject } from 'vue'
  import { useRouter } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import { edgeDNSService } from '@/services/v2/edge-dns/edge-dns-service'
  import copyBlock from '@aziontech/webkit/button-copy'
  import ListTable from '@/components/list-table/ListTable.vue'
  import { DataTableActionsButtons } from '@/components/list-table'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'edge-dns-view' })

  defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const router = useRouter()
  const nameServers = ref('ns1.aziondns.net;ns2.aziondns.com;ns3.aziondns.org')

  const handleNavigateToCreate = () => {
    router.push('edge-dns/create')
  }
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
              showCopy: true
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

  const frozenColumns = ['name']

  const getFilters = computed(() => {
    return getColumns.value.filter((column) => column.field !== 'active')
  })

  const handleBeforeGoToAddPage = () => {
    handleTrackEvent()
  }

  const handleBeforeGoToEdit = () => {
    handleTrackEditEvent()
  }
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
      <ListTable
        :listService="edgeDNSService.listEdgeDNSService"
        :columns="getColumns"
        :actions="actions"
        editPagePath="/edge-dns/edit"
        defaultOrderingFieldName="-last_modified"
        exportFileName="Edge DNS"
        :csvMapper="csvMapper"
        :lazy="true"
        :frozenColumns="frozenColumns"
        :hideLastModifiedColumn="true"
        :allowedFilters="getFilters"
        emptyListMessage="No zone found."
        :emptyBlock="{
          title: 'No DNS Zones yet',
          description:
            'Create your first DNS zone to host authoritative records and control domain name resolution.',
          createButtonLabel: 'Zone',
          documentationService: documentationService
        }"
        @click-to-create="handleNavigateToCreate"
        @on-before-go-to-add-page="handleBeforeGoToAddPage"
        @on-before-go-to-edit="handleBeforeGoToEdit"
      />
    </template>
  </ContentBlock>
</template>
