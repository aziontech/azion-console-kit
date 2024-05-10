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
        :rowActions="actionsRow"
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
  <DialogPurge
    @closeDialog="closeDialog"
    v-model:visible="showDialogPurge"
    :isLoading="isLoading"
    @repurge="repurgeEvent"
  ></DialogPurge>
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
  const isLoading = ref(false)
  const purgeToRepurge = ref()

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const closeDialog = () => {
    isLoading.value = null
    showDialogPurge.value = false
  }

  const openDialogPurge = (item) => {
    showDialogPurge.value = true
    purgeToRepurge.value = item
  }

  const repurgeEvent = async () => {
    const dataPurge = {
      purgeType: purgeToRepurge.value.type,
      argumentsPurge: purgeToRepurge.value.arguments,
      layer: purgeToRepurge.value.layer
    }
    try {
      await props.createRealTimePurgeService(dataPurge)
    } catch  {
      isLoading.value = false
    } 
    finally {
      isLoading.value = false
    }
  }

  const actionsRow = ref([
    {
      label: 'Repurge',
      icon: 'pi pi-refresh',
      command: (item) => {
        openDialogPurge(item)
      }
    }
  ])

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
        header: 'Arguments'
      }
    ]
  })
</script>
