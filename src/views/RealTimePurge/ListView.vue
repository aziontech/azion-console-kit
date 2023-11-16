<template>
  <ListTableBlock
    v-if="hasContentToList"
    :listService="pros.listRealTimePurgeService"
    :columns="getColumns"
    pageTitle="Real-Time Purge"
    addButtonLabel="Add Purge"
    createPagePath="real-time-purge/create"
    editPagePath="real-time-purge/edit"
    @on-load-data="handleLoadData"
  >
  </ListTableBlock>
  <EmptyResultsBlock
    v-else
    pageTitle="Real-Time Purge"
    title="No purge added"
    description="Create your first Real-Time Purge."
    createButtonLabel="Real-Time Purge"
    createPagePath="real-time-purge/create"
    :documentationService="documentationService"
  >
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import ListTableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'

  const pros = defineProps({
    listRealTimePurgeService: { required: true, type: Function },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const hasContentToList = ref(false)

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'date',
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
