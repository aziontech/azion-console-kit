<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Personal Tokens"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listPersonalTokensService"
        :columns="getColumns"
        addButtonLabel="Personal Token"
        createPagePath="personal-tokens/create"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleTrackEvent"
        :enableEditClick="false"
        emptyListMessage="No personal tokens found."
        :actions="actions"
      />
      <EmptyResultsBlock
        v-else
        title="No personal tokens have been generated"
        description="Click the button below to generate your first personal token."
        createButtonLabel="Personal Token"
        createPagePath="personal-tokens/create"
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
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { ref, inject } from 'vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
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
  const actions = [
    {
      type: 'delete',
      title: 'personal token',
      icon: 'pi pi-trash',
      service: props.deletePersonalTokenService
    }
  ]

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

  const handleTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Personal Token'
    })
  }
</script>
