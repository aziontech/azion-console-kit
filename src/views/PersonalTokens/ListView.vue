<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Personal Tokens"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listPersonalTokensService"
        :deleteService="deletePersonalTokenService"
        :columns="getColumns"
        pageTitleDelete="Personal Token"
        addButtonLabel="Personal Token"
        createPagePath="personal-tokens/create"
        @on-load-data="handleLoadData"
        :enableEditClick="false" />
      <EmptyResultsBlock
        v-else
        title="No personal tokens found"
        description="Create your first personal token."
        createButtonLabel="Personal Token"
        createPagePath="personal-tokens/create"
        :documentationService="documentationService"
      >
        <template #illustration>
          <Illustration />
        </template> </EmptyResultsBlock
    ></template>
  </ContentBlock>
</template>

<script setup>
  import { ref } from 'vue'
  import ListTableBlock from '@/templates/list-table-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
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
      header: 'Name'
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
      sortField: 'createdDate',
      header: 'Last Modified'
    },
    {
      field: 'expiresAt',
      sortField: 'expiresAtDate',
      header: 'Expiration Date'
    }
  ])

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }
</script>
