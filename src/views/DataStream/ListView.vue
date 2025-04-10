<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Data Stream" />
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
            v-if="hasContentToList"
            addButtonLabel="Stream"
            createPagePath="/data-stream/create"
            editPagePath="/data-stream/edit"
            :listService="listDataStreamService"
            :columns="getColumns"
            @on-load-data="handleLoadData"
            emptyListMessage="No streams found."
            :apiFields="DATA_STREAM_API_FIELDS"
            :actions="actions"
            :defaultOrderingFieldName="'name'"
          ></FetchListTableBlock>
          <EmptyResultsBlock
            v-else
            title="No stream has been created"
            description="Click the button below to create your first stream."
            createButtonLabel="Stream"
            createPagePath="data-stream/create"
            :documentationService="documentationService"
            :disabledList="isMaxDomainsReached"
          >
            <template #illustration>
              <Illustration />
            </template>
          </EmptyResultsBlock>
        </div>
      </div>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { computed, ref, onMounted } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { onBeforeRouteLeave } from 'vue-router'
  import InlineMessage from 'primevue/inlinemessage'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { listWorkloadsService } from '@/services/workloads-services'
  import { useAccountStore } from '@/stores/account'

  defineOptions({ name: 'data-stream-view' })

  const props = defineProps({
    listDataStreamService: {
      required: true,
      type: Function
    },
    deleteDataStreamService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const store = useAccountStore()
  const hasNoPermissionToCreateDataStream = computed(() => !store.hasPermissionToEditDataStream)
  const DATA_STREAM_API_FIELDS = ['id', 'name', 'data_source', 'active', 'data_set_id', 'endpoint']
  const domainsCount = ref(0)
  const domainsLoading = ref(true)
  const toast = useToast()

  const loadWorkloads = async () => {
    try {
      domainsLoading.value = true
      const response = await listWorkloadsService({
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
      service: props.deleteDataStreamService
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

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
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

  onBeforeRouteLeave((to, from, next) => {
    if (to.name === 'edit-data-stream' && isMaxDomainsReached.value) {
      return next(false)
    }
    return next(true)
  })
</script>
