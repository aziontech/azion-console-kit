<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Real-Time Purge"></PageHeadingBlock>
    </template>
    <template #content>
      <InlineMessage
        class="w-fit mb-8"
        severity="info"
      >
        When creating a new purge, it's queued for execution and will appear in the table below once
        completed.
      </InlineMessage>
      <ListTableBlock
        ref="listPurgeRef"
        v-if="hasContentToList"
        disabledList
        :listService="props.listRealTimePurgeService"
        :columns="getColumns"
        addButtonLabel="Purge"
        createPagePath="real-time-purge/create"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleTrackEvent"
        :isGraphql="true"
        :enableEditClick="false"
        emptyListMessage="No purge found."
        :actions="actionsRow"
        showHearderWithLoad
        :showRowPending="isLoading"
      >
      </ListTableBlock>
      <EmptyResultsBlock
        v-else
        title="No purges have been added"
        description="Click the button below to add your first purge."
        createButtonLabel="Purge"
        @click-to-create="handleTrackEvent"
        createPagePath="real-time-purge/create"
        :documentationService="documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import InlineMessage from 'primevue/inlinemessage'
  import { computed, ref, inject } from 'vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { useToast } from 'primevue/usetoast'
  import { purgeService } from '@/services/v2'
  import { useRoute, useRouter } from 'vue-router'
  import { useAccountStore } from '@/stores/account'
  import { usePurgeStore } from '@/stores/purge'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    listRealTimePurgeService: { required: true, type: Function },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const listPurgeRef = ref('')
  const route = useRoute()
  const router = useRouter()
  const hasContentToList = ref(true)
  const isLoading = ref(null)
  const toast = useToast()
  const timeToReload = 9000
  const { accountData } = useAccountStore()
  const purgeStore = usePurgeStore()

  const user = accountData
  const countPurge = ref(0)

  const handleLoadData = async (event) => {
    countPurge.value = listPurgeRef.value.data.filter((item) => item.user === user.email).length
    hasContentToList.value = event
    const { isPending } = route.query
    const hasPendingMismatch = isPending && purgeStore.getPurgeCount !== countPurge.value

    if (hasPendingMismatch) {
      isLoading.value = true
      countPurge.value++
      handleTimeLoad()
    } else {
      router.replace({ query: {} })
    }
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
      summary: severity,
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
      const { feedback } = await purgeService.createPurge(dataPurge)
      showToast('success', feedback)
      handleClickedOnEvent(purgeToRepurge.type)
    } catch (error) {
      showToast('error', error)
    }
  }

  const handleRepurge = async (item) => {
    isLoading.value = true
    item.disabled = true
    countPurge.value++
    try {
      await repurgeEvent(item)
      await handleTimeLoad()
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
          columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
      }
    ]
  })

  const handleTimeLoad = async () => {
    let countItens = 0
    do {
      await new Promise((resolve) => setTimeout(resolve, timeToReload))
      const result = await props.listRealTimePurgeService()
      countItens = result.filter((item) => item.user === user.email).length
      if (countItens === countPurge.value) {
        listPurgeRef.value.data = result
        listPurgeRef.value.updateDataTablePagination()
        router.replace({ query: {} })
      }
    } while (countItens !== countPurge.value)
    isLoading.value = false
  }
</script>
