<script setup>
  import ContentBlock from '@/templates/content-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { computed, inject } from 'vue'
  import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
  import { DataTableActionsButtons } from '@/components/DataTable'
  import CloneBlock from '@/templates/clone-block'

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

  defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const actions = [
    {
      type: 'dialog',
      label: 'Clone',
      icon: 'pi pi-fw pi-clone',
      dialog: {
        component: CloneBlock,
        body: (item) => ({
          data: {
            service: edgeFirewallService.cloneEdgeFirewallService,
            itemType: 'Firewall',
            ...item
          }
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
    },
    {
      field: 'last_modified',
      header: 'Last Modified',
      sortField: 'last_modified',
      filterPath: 'last_modified',
      type: 'component',
      component: (columnData, rowData, dependencies) => {
        return columnBuilder({
          data: rowData,
          columnAppearance: 'last-modified',
          dependencies
        })
      }
    }
  ])

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
      <PageHeadingBlock
        pageTitle="Edge Firewall"
        description="Protect applications with advanced security rules."
      >
        <template #default>
          <div class="flex justify-between gap-2 w-full">
            <div class="flex gap-2">
              <DataTableActionsButtons
                size="small"
                label="Firewall"
                @click="handleTrackEvent"
                createPagePath="/firewalls/create"
                data-testid="create_Firewall_button"
              />
            </div>
          </div>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        createPagePath="/firewalls/create"
        editPagePath="/firewalls/edit"
        :listService="edgeFirewallService.listEdgeFirewallService"
        @on-before-go-to-edit="handleTrackEditEvent"
        :columns="getColumns"
        emptyListMessage="No Firewall found."
        @on-before-go-to-add-page="handleTrackEvent"
        :actions="actions"
        :apiFields="EDGE_FIREWALL_API_FIELDS"
        :defaultOrderingFieldName="'-last_modified'"
        :frozen-columns="['name']"
        exportFileName="Firewalls"
        :allowedFilters="getColumns"
        :emptyBlock="{
          title: 'No Firewall has been created.',
          description: 'Click the button below to create your first Firewall.',
          createButtonLabel: 'Firewall',
          createPagePath: '/firewalls/create',
          documentationService: documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
