<template>
  <ListTableBlock
    v-if="hasContentToList"
    :listService="listPersonalTokensService"
    :deleteService="deletePersonalTokenService"
    :columns="getColumns"
    pageTitle="Personal Tokens"
    addButtonLabel="Add Personal Token"
    createPagePath="personal-tokens/create"
    @on-load-data="handleLoadData"
    :visibleEditAction="false"
  />
  <EmptyResultsBlock
    v-else
    title="No personal tokens added"
    description="Create your first personal token."
    createButtonLabel="Add personal token"
    createPagePath="personal-tokens/create"
    :documentationService="documentationService"
  >
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>
</template>

<script setup>
  import { ref } from 'vue'
  import ListTableBlock from '@/templates/list-table-block'

  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

  defineProps({
    listPersonalTokensService: {
      type: Function,
      required: true
    },
    deletePersonalTokenService: {
      type: Function,
      required: true
    },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const hasContentToList = ref(true)

  const getColumns = ref([
    {
      field: 'name',
      header: 'Token Name'
    },
    {
      field: 'description',
      header: 'Description',
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'expand-text-column' })
    },
    {
      field: 'scope',
      header: 'Scope'
    },
    {
      field: 'created',
      header: 'Last modified'
    },
    {
      field: 'expiresAt',
      header: 'Expires'
    }
  ])

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }
</script>
