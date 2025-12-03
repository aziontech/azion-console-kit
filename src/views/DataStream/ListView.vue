<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Data Stream"
        description="Stream real-time data for analytics and insights."
      >
        <template #default>
          <div class="flex justify-between gap-2 w-full">
            <div class="flex gap-2">
              <DataTableActionsButtons
                size="small"
                label="Stream"
                createPagePath="/data-stream/create"
                :disabled="hasNoPermissionToCreateDataStream || disabledList"
                data-testid="create_Stream_button"
              />
            </div>
          </div>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <div class="flex flex-col gap-3 items-start">
        <InlineMessage
          v-if="hasNoPermissionToCreateDataStream"
          class="w-fit"
          severity="info"
          data-testid="permission-rule-message-data-stream"
        >
          This account has <strong>View Data Stream</strong> permission only. It allows viewing the
          account’s streams but doesn't permit creating, editing, or deleting streams.
        </InlineMessage>

        <InlineMessage
          v-if="isMaxDomainsReached"
          severity="info"
        >
          Since you have reached the limit of 3000 domains, you can't admnistrate your streams
          through Azion Console. Please use the Data Stream API.
        </InlineMessage>
        <div class="w-full">
          <FetchListTableBlock
            :disabledList="hasNoPermissionToCreateDataStream || disabledList"
            createPagePath="/data-stream/create"
            editPagePath="/data-stream/edit"
            :listService="dataStreamService.listDataStreamService"
            :columns="getColumns"
            @on-load-data="handleLoadData"
            emptyListMessage="No streams found."
            :apiFields="DATA_STREAM_API_FIELDS"
            :actions="actions"
            :defaultOrderingFieldName="'-last_modified'"
            :frozenColumns="['name']"
            exportFileName="Data Stream"
            :csvMapper="csvMapper"
            :documentationService="documentationService"
            :allowedFilters="getFilters"
            :emptyBlock="{
              title: 'No stream has been created.',
              description: 'Click the button below to create your first stream.',
              createPagePath: '/data-stream/create',
              createButtonLabel: 'Stream',
              documentationService: documentationService
            }"
          />
        </div>
      </div>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { computed, ref, onMounted } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import ContentBlock from '@/templates/content-block'
  import { onBeforeRouteLeave } from 'vue-router'
  import InlineMessage from 'primevue/inlinemessage'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { listWorkloadsDynamicFieldsService } from '@/services/workloads-services'
  import { useAccountStore } from '@/stores/account'
  import { dataStreamService } from '@/services/v2/data-stream/data-stream-service'
  import { DataTableActionsButtons } from '@/components/DataTable'

  defineOptions({ name: 'data-stream-view' })

  defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const store = useAccountStore()
  const hasNoPermissionToCreateDataStream = computed(() => !store.hasPermissionToEditDataStream)
  const DATA_STREAM_API_FIELDS = [
    'id',
    'name',
    'active',
    'outputs',
    'transform',
    'inputs',
    'last_editor',
    'last_modified'
  ]
  const domainsCount = ref(0)
  const domainsLoading = ref(true)
  const toast = useToast()

  const loadWorkloads = async () => {
    try {
      domainsLoading.value = true
      const response = await listWorkloadsDynamicFieldsService({
        fields: 'id',
        ordering: 'id',
        page: 1,
        pageSize: 1
      })
      domainsCount.value = response.count
    } catch (error) {
      toastBuilder('error', error)
    } finally {
      domainsLoading.value = false
    }
  }

  onMounted(() => {
    loadWorkloads()
  })

  const hasContentToList = ref(true)
  const actions = [
    {
      type: 'delete',
      title: 'stream',
      icon: 'pi pi-trash',
      service: dataStreamService.deleteDataStreamService
    }
  ]

  const toastBuilder = (severity, detail) => {
    if (!detail) return
    const options = {
      closable: true,
      severity,
      summary: severity,
      detail
    }

    toast.add(options)
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const isMaxDomainsReached = computed(() => {
    return domainsCount.value >= 3000
  })

  const disabledList = computed(() => {
    return isMaxDomainsReached.value || domainsLoading.value
  })

  const csvMapper = (rowData) => {
    return {
      name: rowData.name,
      id: rowData.id,
      dataSource: rowData.dataSource,
      templateName: rowData.templateName,
      endpointType: rowData.endpointType,
      lastEditor: rowData.lastEditor,
      lastModified: rowData.lastModified,
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
        field: 'dataSource',
        header: 'Source',
        disableSort: true
      },
      {
        field: 'templateName',
        header: 'Template',
        disableSort: true
      },
      {
        field: 'endpointType',
        header: 'Connector',
        disableSort: true
      },
      {
        field: 'active',
        header: 'Status',
        type: 'component',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      }
    ]
  })

  const getFilters = computed(() => {
    return getColumns.value.filter(
      (column) =>
        column.field !== 'dataSource' &&
        column.field !== 'templateName' &&
        column.field !== 'endpointType'
    )
  })

  onBeforeRouteLeave((to, from, next) => {
    if (to.name === 'edit-data-stream' && isMaxDomainsReached.value) {
      return next(false)
    }
    return next(true)
  })
</script>
