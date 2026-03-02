<script setup>
  import { computed, inject } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import ContentBlock from '@/templates/content-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import CloneBlock from '@/templates/clone-block'
  import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
  import { COLUMN_STYLES, columnStyles } from '@/helpers/column-styles'
  import { INFORMATION_TEXTS } from '@/helpers'
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
    ]
  })
</script>

<template>
  <ContentBlock data-testid="edge-applications-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="Applications"
        description="Define and manage applications that control request processing and application logic on Azion's global infrastructure."
        data-testid="edge-applications-heading"
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Application"
            @click="handleTrackEvent"
            createPagePath="/applications/create?origin=list"
            helpCenterPath="/edge-applications"
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
          title: 'No Applications yet',
          description:
            'Create your first application to define how requests are processed, routed, and handled.',
          createButtonLabel: 'Application',
          createPagePath: '/applications/create?origin=list',
          documentationService: props.documentationService,
          emptyListMessage: 'No Applications found.'
        }"
      />
    </template>
  </ContentBlock>
</template>
