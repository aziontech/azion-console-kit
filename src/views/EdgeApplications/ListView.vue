<script setup>
  import { computed, inject, ref } from 'vue'

  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import CloneDialog from './Dialog/Clone.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { useToast } from 'primevue/usetoast'
  import { INFORMATION_TEXTS } from '@/helpers'

  defineOptions({ name: 'list-edge-applications' })
  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    listEdgeApplicationsService: {
      required: true,
      type: Function
    },
    deleteEdgeApplicationService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const hasContentToList = ref(true)
  const toast = useToast()
  const actions = [
    {
      type: 'dialog',
      label: 'Clone',
      icon: 'pi pi-fw pi-clone',
      dialog: {
        component: CloneDialog,
        body: (item) => ({
          data: item
        })
      }
    },
    {
      type: 'delete',
      label: 'Delete',
      title: 'edge application',
      icon: 'pi pi-trash',
      service: props.deleteEdgeApplicationService
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

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }
  const handleTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Edge Application'
    })
  }

  const handleTrackEditEvent = (edgeApplication) => {
    tracker.product.clickToEdit({
      productName: 'Edge Application'
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
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-with-tag'
          })
        }
      },
      {
        field: 'lastEditor',
        header: 'Last Editor'
      },
      {
        field: 'lastModify',
        sortField: 'lastModified',
        header: 'Last Modified'
      }
    ]
  })

  const EDGE_APPLICATION_API_FIELDS = [
    'id',
    'name',
    'last_editor',
    'last_modified',
    'active',
    'product_version'
  ]
</script>

<template>
  <ContentBlock data-testid="edge-applications-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="Edge Applications"
        data-testid="edge-applications-heading"
      />
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        addButtonLabel="Edge Application"
        createPagePath="/edge-applications/create?origin=list"
        editPagePath="/edge-applications/edit"
        :listService="listEdgeApplicationsService"
        :columns="getColumns"
        :apiFields="EDGE_APPLICATION_API_FIELDS"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        emptyListMessage="No edge applications found."
        data-testid="edge-applications-list-table-block"
        :actions="actions"
        :defaultOrderingFieldName="'name'"
      />
      <EmptyResultsBlock
        v-else
        title="No edge applications have been created"
        description="Click the button below to create your first edge application."
        createButtonLabel="Edge Application"
        createPagePath="/edge-applications/create?origin=list"
        :documentationService="props.documentationService"
        data-testid="edge-applications-empty-results-block"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>
