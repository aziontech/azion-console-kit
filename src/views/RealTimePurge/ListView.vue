<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Real-Time Purge"></PageHeadingBlock>
    </template>
    <template #content>
      <InlineMessage
        class="w-fit mb-8"
        severity="info"
        >When creating a new purge, it's queued for execution and will appear in the history once
        completed.
      </InlineMessage>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="props.listRealTimePurgeService"
        :columns="getColumns"
        addButtonLabel="Purge"
        createPagePath="real-time-purge/create"
        @on-load-data="handleLoadData"
        :isGraphql="true"
        :enableEditClick="false"
        emptyListMessage="No purge found."
        :actions="actionsRow"
      >
      </ListTableBlock>
      <EmptyResultsBlock
        v-else
        title="No purges have been added"
        description="Click the button below to add your first purge."
        createButtonLabel="Purge"
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
  import DialogPurge from './Dialog'
  import { computed, ref } from 'vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { useToast } from 'primevue/usetoast'

  const props = defineProps({
    listRealTimePurgeService: { required: true, type: Function },
    createRealTimePurgeService: {
      type: Function,
      required: true
    },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const hasContentToList = ref(true)
  const showDialogPurge = ref(false)
  const isLoading = ref(null)
  const toast = useToast()

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const closeDialog = () => {
    isLoading.value = null
    showDialogPurge.value = false
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
      const { feedback } = await props.createRealTimePurgeService(dataPurge)
      showToast('success', feedback)
    } catch (error) {
      showToast('error', error)
    } finally {
      isLoading.value = false
      closeDialog()
    }
  }

  const actionsRow = [
    {
      type: 'dialog',
      label: 'Repurge',
      icon: 'pi pi-refresh',
      dialog: {
        component: DialogPurge,
        body: (item) => ({
          data: {
            isLoading,
            item,
            repurge: repurgeEvent
          }
        })
      }
    }
  ]

  const getColumns = computed(() => {
    return [
      {
        field: 'time',
        header: 'Date'
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
</script>
