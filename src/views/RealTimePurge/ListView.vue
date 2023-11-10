<template>
  <ListTableBlock
    :listService="pros.listRealTimePurgeService"
    :columns="getColumns"
    pageTitle="Real-Time Purge"
    addButtonLabel="Add Purge"
    createPagePath="real-time-purge/create"
    editPagePath="real-time-purge/edit"
  >
  </ListTableBlock>
</template>

<script setup>
  import { defineProps, computed } from 'vue'
  import ListTableBlock from '@/templates/list-table-block'

  const pros = defineProps({
    listRealTimePurgeService: { required: true, type: Function }
  })

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
