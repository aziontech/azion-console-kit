<script setup>
  import { computed, inject } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import CloneBlock from '@/templates/clone-block'
  import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
  import { COLUMN_STYLES, columnStyles } from '@/helpers/column-styles'
  import { DataTableActionsButtons } from '@/components/DataTable'

  defineOptions({ name: 'edge-firewall-view' })

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */

  const tracker = inject('tracker')

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
      style: columnStyles.priority(2, 200, 350),
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
      filterPath: 'id',
      style: COLUMN_STYLES.FIT_CONTENT
    },
    {
      field: 'active',
      header: 'Status',
      sortField: 'active',
      filterPath: 'active',
      type: 'component',
      style: COLUMN_STYLES.FIT_CONTENT,
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      }
    },
    {
      field: 'lastEditor',
      header: 'Last Editor',
      sortField: 'last_editor',
      filterPath: 'last_editor',
      style: COLUMN_STYLES.PRIORITY_SM
    },
    {
      field: 'lastModified',
      header: 'Last Modified',
      sortField: 'lastModified',
      filterPath: 'lastModified',
      style: COLUMN_STYLES.FIT_CONTENT
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
        description="Define and manage firewalls that inspect and protect requests on Azion's global infrastructure."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Firewall"
            @click="handleTrackEvent"
            createPagePath="/firewalls/create"
            data-testid="create_Firewall_button"
            :documentation-service="documentationService"
          />
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
        :defaultOrderingFieldName="'-last_modified'"
        :frozen-columns="['name']"
        exportFileName="Firewalls"
        :allowedFilters="getColumns"
        :emptyBlock="{
          title: 'No Firewalls yet',
          description:
            'Create your first firewall to define security modules and enforcement behavior for incoming traffic.',
          createButtonLabel: 'Firewall',
          createPagePath: '/firewalls/create',
          documentationService: documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
