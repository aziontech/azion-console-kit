<script setup>
  import { computed, inject } from 'vue'
  import { useRouter } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
  import CloneBlock from '@/templates/clone-block'
  import ListTable from '@/components/list-table/ListTable.vue'
  import { DataTableActionsButtons } from '@/components/list-table'

  defineOptions({ name: 'edge-firewall-view' })

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const router = useRouter()

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
      field: 'lastEditor',
      header: 'Last Editor',
      sortField: 'last_editor',
      filterPath: 'last_editor'
    },
    {
      field: 'lastModified',
      header: 'Last Modified',
      sortField: 'lastModified',
      filterPath: 'lastModified'
    }
  ])

  const frozenColumns = ['name']

  const allowedFilters = computed(() => {
    return getColumns.value.filter((col) => col.header && col.header !== 'Last Modified')
  })

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

  const handleBeforeGoToAddPage = () => {
    handleTrackEvent()
  }

  const handleBeforeGoToEdit = () => {
    handleTrackEditEvent()
  }

  const handleNavigateToCreate = () => {
    router.push('/firewalls/create')
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
      <ListTable
        :listService="edgeFirewallService.listEdgeFirewallService"
        :columns="getColumns"
        :actions="actions"
        editPagePath="/firewalls/edit"
        defaultOrderingFieldName="-last_modified"
        exportFileName="Firewalls"
        :lazy="true"
        :frozenColumns="frozenColumns"
        :allowedFilters="allowedFilters"
        emptyListMessage="No Firewall found."
        :emptyBlock="{
          title: 'No Firewalls yet',
          description:
            'Create your first firewall to define security modules and enforcement behavior for incoming traffic.',
          createButtonLabel: 'Firewall',
          documentationService: documentationService
        }"
        @on-before-go-to-add-page="handleBeforeGoToAddPage"
        @on-before-go-to-edit="handleBeforeGoToEdit"
        @click-to-create="handleNavigateToCreate"
      />
    </template>
  </ContentBlock>
</template>
