<script setup>
  import { computed, inject, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { INFORMATION_TEXTS } from '@/helpers'
  import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
  import CloneBlock from '@/templates/clone-block'
  import ListTable from '@/components/list-table/ListTable.vue'
  import { DataTableActionsButtons } from '@/components/list-table'

  defineOptions({ name: 'list-edge-applications' })
  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const router = useRouter()

  const toast = useToast()
  const listTableRef = ref(null)

  const handleNavigateToCreate = () => {
    router.push('/applications/create?origin=list')
  }

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
    ]
  })

  const frozenColumns = ['name']

  const allowedFilters = computed(() => {
    return getColumns.value.filter((col) => col.header && col.header !== 'Last Modified')
  })

  const handleBeforeGoToAddPage = () => {
    handleTrackEvent()
  }

  const handleBeforeGoToEdit = (item) => {
    handleTrackEditEvent(item)
  }
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
            data-testid="create_Application_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <ListTable
        ref="listTableRef"
        :listService="edgeAppService.listEdgeApplicationsService"
        :columns="getColumns"
        :actions="actions"
        editPagePath="/applications/edit"
        defaultOrderingFieldName="-last_modified"
        exportFileName="Applications"
        :lazy="true"
        :frozenColumns="frozenColumns"
        :allowedFilters="allowedFilters"
        emptyListMessage="No applications found."
        :emptyBlock="{
          title: 'No Applications yet',
          description:
            'Create your first application to define how requests are processed, routed, and handled.',
          createButtonLabel: 'Application',
          documentationService: props.documentationService,
          emptyListMessage: 'No Applications found.'
        }"
        @click-to-create="handleNavigateToCreate"
        @on-before-go-to-add-page="handleBeforeGoToAddPage"
        @on-before-go-to-edit="handleBeforeGoToEdit"
      />
    </template>
  </ContentBlock>
</template>
