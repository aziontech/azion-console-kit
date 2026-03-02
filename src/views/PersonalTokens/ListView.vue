<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Personal Tokens"
        description="Define and manage personal access tokens used for API authentication."
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
        :listService="personalTokenService.listPersonalTokensService"
        :columns="getColumns"
        addButtonLabel="Personal Token"
        createPagePath="personal-tokens/create"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleTrackEvent"
        :enableEditClick="false"
        :actions="actions"
        exportFileName="Personal Tokens"
        :emptyBlock="{
          title: 'No Personal Tokens yet',
          description: 'Create your first Personal Token to securely access your account via API.',
          documentationService: props.documentationService,
          emptyListMessage: 'No personal tokens found.',
          createPagePath: 'personal-tokens/create',
          createButtonLabel: 'Personal Token'
        }"
      />
    </template>
  </ContentBlock>
</template>

<script setup>
  import { ref, inject } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import ListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { personalTokenService } from '@/services/v2/personal-token/personal-token-service'
  import { COLUMN_STYLES, columnStyles } from '@/helpers/column-styles'
  import { DataTableActionsButtons } from '@/components/DataTable'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
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
      service: personalTokenService.deletePersonalTokenService
    }
  ]

  const getColumns = ref([
    {
      field: 'name',
      header: 'Name',
      style: columnStyles.priority(2, 200, 350)
    },
    {
      field: 'description',
      header: 'Description',
      type: 'component',
      style: columnStyles.priority(3, 200, 300),
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'text-format-with-popup' })
    },
    {
      field: 'scope',
      header: 'Scope',
      style: COLUMN_STYLES.FIT_CONTENT
    },
    {
      field: 'expiresAt',
      sortField: 'expiresAtDate',
      header: 'Expiration Date',
      style: COLUMN_STYLES.FIT_CONTENT
    },
    {
      field: 'lastModified',
      header: 'Last Modified',
      sortField: 'lastModified',
      filterPath: 'lastModified',
      style: COLUMN_STYLES.FIT_CONTENT
    }
  ])

  const handleTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Personal Token'
    })
  }
</script>
