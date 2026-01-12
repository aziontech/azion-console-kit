<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Personal Tokens"
        description="Generate and manage personal tokens for secure access to your account."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Personal Token"
            createPagePath="personal-tokens/create"
            @click="handleTrackEvent"
            data-testid="create_PersonalToken_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        :listService="listPersonalTokensService"
        :columns="getColumns"
        addButtonLabel="Personal Token"
        createPagePath="personal-tokens/create"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleTrackEvent"
        :enableEditClick="false"
        :actions="actions"
        :emptyBlock="{
          title: 'No personal tokens have been generated',
          description: 'Click the button below to generate your first personal token.',
          documentationService: props.documentationService,
          emptyListMessage: 'No personal tokens found.'
        }"
      />
    </template>
  </ContentBlock>
</template>

<script setup>
  import ContentBlock from '@/templates/content-block'
  import ListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { ref, inject } from 'vue'
  import { DataTableActionsButtons } from '@/components/DataTable'

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

  const actions = [
    {
      label: 'Delete',
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
      style: 'max-width: 250px',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'text-format-with-popup' })
    },
    {
      field: 'scope',
      header: 'Scope'
    },
    {
      field: 'expiresAt',
      sortField: 'expiresAtDate',
      header: 'Expiration Date'
    },
    {
      field: 'lastModified',
      header: 'Last Modified',
      sortField: 'lastModified',
      filterPath: 'lastModified'
    }
  ])

  const handleTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Personal Token'
    })
  }
</script>
