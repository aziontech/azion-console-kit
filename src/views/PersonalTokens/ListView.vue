<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import { computed, ref, inject } from 'vue'
  import { useRouter } from 'vue-router'
  import ListTable from '@/components/list-table'
  import { DataTableActionsButtons } from '@/components/list-table'
  import { personalTokenService } from '@/services/v2/personal-token/personal-token-service'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const router = useRouter()
  const listTableRef = ref()

  const handleNavigateToCreate = () => {
    router.push('personal-tokens/create')
  }

  const actions = [
    {
      label: 'Delete',
      type: 'delete',
      title: 'personal token',
      icon: 'pi pi-trash',
      service: personalTokenService.deletePersonalTokenService
    }
  ]

  const getColumns = computed(() => [
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
      <ListTable
        ref="listTableRef"
        :listService="personalTokenService.listPersonalTokensService"
        :columns="getColumns"
        :actions="actions"
        :enableEditClick="false"
        exportFileName="Personal Tokens"
        emptyListMessage="No personal tokens found."
        :emptyBlock="{
          title: 'No Personal Tokens yet',
          description: 'Create your first Personal Token to securely access your account via API.',
          documentationService: props.documentationService,
          emptyListMessage: 'No personal tokens found.',
          createButtonLabel: 'Personal Token'
        }"
        @click-to-create="handleNavigateToCreate"
        @on-before-go-to-add-page="handleTrackEvent"
      />
    </template>
  </ContentBlock>
</template>
