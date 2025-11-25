<script setup>
  import { computed, inject } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { useToast } from 'primevue/usetoast'
  import { INFORMATION_TEXTS } from '@/helpers'
  import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
  import CloneBlock from '@/templates/clone-block'
  import { DataTableActionsButtons } from '@/components/DataTable'

  defineOptions({ name: 'list-edge-applications' })
  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const toast = useToast()
  const actions = [
    {
      type: 'dialog',
      label: 'Clone',
      icon: 'pi pi-fw pi-clone',
      dialog: {
        component: CloneBlock,
        body: (item) => ({
          data: {
            ...item,
            service: edgeAppService.cloneEdgeApplicationService,
            itemType: 'Application',
            name: item.name.text
          }
        })
      }
    },
    {
      type: 'delete',
      label: 'Delete',
      title: 'Application',
      icon: 'pi pi-trash',
      service: edgeAppService.deleteEdgeApplicationService
    }
  ]

  const showLockedMessage = () => {
    const options = {
      closable: true,
      severity: 'warn',
      summary: 'Warning',
      detail: INFORMATION_TEXTS.LOCKED_MESSAGE_TOAST
    }

    toast.add(options)
  }

  const handleTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Application'
    })
  }

  const handleTrackEditEvent = (edgeApplication) => {
    tracker.product.clickToEdit({
      productName: 'Application'
    })

    if (edgeApplication.isLocked) {
      showLockedMessage()
    }
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name',
        filterPath: 'name.text',
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
    ]
  })

  const EDGE_APPLICATION_API_FIELDS = [
    'id',
    'name',
    'last_editor',
    'last_modified',
    'last_modify',
    'product_version',
    'active'
  ]
</script>

<template>
  <ContentBlock data-testid="edge-applications-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="Applications"
        data-testid="edge-applications-heading"
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Application"
            @click="handleTrackEvent"
            createPagePath="/applications/create?origin=list"
            data-testid="create_Application_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        createPagePath="/applications/create?origin=list"
        editPagePath="/applications/edit"
        :listService="edgeAppService.listEdgeApplicationsService"
        :columns="getColumns"
        :apiFields="EDGE_APPLICATION_API_FIELDS"
        @on-before-go-to-add-page="handleTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        emptyListMessage="No applications found."
        data-testid="edge-applications-list-table-block"
        :actions="actions"
        :defaultOrderingFieldName="'-last_modified'"
        :frozenColumns="['name']"
        exportFileName="Applications"
        :allowedFilters="getColumns"
        :emptyBlock="{
          title: 'No applications have been created',
          description: 'Click the button below to create your first Application.',
          createButtonLabel: 'Application',
          createPagePath: '/applications/create?origin=list',
          documentationService: props.documentationService,
          emptyListMessage: 'No applications found.'
        }"
      />
    </template>
  </ContentBlock>
</template>
