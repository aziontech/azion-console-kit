<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EmptyResultsBlock from '@aziontech/webkit/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import { computed, ref, inject } from 'vue'
  import ListTable from '@/components/list-table'
  import { DataTableActionsButtons } from '@/components/list-table'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { purgeService } from '@/services/v2/purge/purge-service'
  import { usePurgeStore } from '@/stores/purge'
  import { capitalizeFirstLetter } from '@/helpers'
  import { useRouter } from 'vue-router'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const router = useRouter()

  const props = defineProps({
    listRealTimePurgeService: { required: true, type: Function },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const isLoading = ref(null)
  const toast = useToast()
  const purgeStore = usePurgeStore()
  const repurgesNeedingFocus = ref(0)
  const countPurge = ref(0)
  const hasContentToList = ref(true)
  const listTableRef = ref()

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const handleNavigateToCreate = () => {
    router.push('real-time-purge/create')
  }

  const handleTrackEvent = () => {
    purgeStore.setPurgeCount(countPurge.value)
    tracker.product.clickToCreate({
      productName: 'Purge'
    })
  }

  const handleClickedOnEvent = (purgeType) => {
    tracker.product.clickedOnEvent('Purge', { purgeType })
  }

  const showToast = (severity, detail) => {
    if (!detail) return
    const options = {
      closable: true,
      severity,
      summary: capitalizeFirstLetter(severity),
      detail
    }

    toast.add(options)
  }

  const repurgeEvent = async (purgeToRepurge) => {
    const dataPurge = {
      purgeType: purgeToRepurge.type,
      argumentsPurge: purgeToRepurge.arguments,
      layer: purgeToRepurge.layer
    }
    try {
      await purgeService.createPurge(dataPurge)
      handleClickedOnEvent(purgeToRepurge.type)
    } catch (error) {
      if (error && typeof error.showErrors === 'function') {
        error.showErrors(toast)
      } else {
        const errorMessage = error?.message || error
        showToast('error', errorMessage)
      }
      isLoading.value = false
      throw error
    }
  }

  const handleRepurge = async (item) => {
    isLoading.value = true
    item.disabled = true
    countPurge.value++
    repurgesNeedingFocus.value++
    try {
      await repurgeEvent(item)
    } catch (error) {
      isLoading.value = false
    } finally {
      item.disabled = false
    }
  }

  const actionsRow = [
    {
      type: 'action',
      label: 'Repurge',
      icon: 'pi pi-refresh',
      tooltip: 'Repurge',
      shouldLoadOnClick: true,
      disabled: (rowData) => rowData.disabled,
      commandAction: async (item) => {
        if (!item.disabled) {
          handleRepurge(item)
        }
      }
    }
  ]

  const getColumns = computed(() => {
    return [
      {
        field: 'time',
        header: 'Date',
        sortField: 'ts'
      },
      {
        field: 'user',
        header: 'User'
      },
      {
        field: 'layer',
        header: 'Layer'
      },
      {
        field: 'type',
        header: 'Type'
      },
      {
        field: 'arguments',
        header: 'Arguments',
        filterPath: 'arguments.content',
        type: 'component',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'text-array-with-popup' })
      }
    ]
  })
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Real-Time Purge"
        description="Invalidate cached content to control content freshness across Azion's global infrastructure."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Purge"
            @click="handleTrackEvent"
            createPagePath="real-time-purge/create"
            data-testid="create_Purge_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <InlineMessage
        class="w-fit mb-8"
        severity="info"
        icon="pi pi-spin pi-spinner"
        v-if="isLoading"
      >
        Purge requests are queued. The table will update automatically once processing is complete.
      </InlineMessage>
      <ListTable
        v-if="hasContentToList"
        ref="listTableRef"
        :listService="props.listRealTimePurgeService"
        :columns="getColumns"
        :actions="actionsRow"
        :isGraphql="true"
        :enableEditClick="false"
        defaultOrderingFieldName="-last_modified"
        exportFileName="Real-Time Purge"
        emptyListMessage="No purge found."
        :paginator="false"
        :hideLastModifiedColumn="true"
        @on-load-data="handleLoadData"
      />
      <EmptyResultsBlock
        v-else
        title="No Purge requests yet"
        description="Create your first purge request to remove cached content."
        createButtonLabel="Purge"
        @click-to-create="handleNavigateToCreate"
        :documentationService="props.documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>
