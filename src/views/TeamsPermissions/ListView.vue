<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Teams Permissions"
        data-testid="teams-permissions__list-view__page-heading"
      />
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        :listService="listTeamPermissionService"
        :columns="getColumns"
        addButtonLabel="Team"
        createPagePath="teams-permission/create"
        editPagePath="teams-permission/edit"
        @on-load-data="handleLoadData"
        emptyListMessage="No teams found."
        :actions="actions"
        @on-before-go-to-add-page="handleTrackEventGoToCreate"
        @on-before-go-to-edit="handleTrackEventGoToEdit"
        :apiFields="TEAM_PERMISSIONS_API_FIELDS"
        :defaultOrderingFieldName="'name'"
      >
      </FetchListTableBlock>
      <EmptyResultsBlock
        v-else
        data-testid="teams-permissions__list-view__empty-results-block"
        title="No teams have been created"
        description="Click the button below to create your first team and add permissions."
        createButtonLabel="Team"
        @click-to-create="handleTrackEventGoToCreate"
        createPagePath="teams-permission/create"
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
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { computed, ref, inject } from 'vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    listTeamPermissionService: { required: true, type: Function },
    deleteTeamPermissionService: { required: true, type: Function },
    documentationService: { required: true, type: Function }
  })

  const hasContentToList = ref(true)

  const TEAM_PERMISSIONS_API_FIELDS = ['id', 'name', 'permissions', 'is_active']

  const actions = [
    {
      type: 'delete',
      title: 'team',
      icon: 'pi pi-trash',
      service: props.deleteTeamPermissionService
    }
  ]

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'permissions',
        header: 'Permissions',
        type: 'component',
        disableSort: true,
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
      },
      {
        field: 'status',
        header: 'Status',
        type: 'component',
        sortField: 'is_active',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      }
    ]
  })

  const handleTrackEventGoToCreate = () => {
    tracker.product.clickToCreate({
      productName: 'Teams Permissions'
    })
  }

  const handleTrackEventGoToEdit = () => {
    tracker.product.clickToEdit({
      productName: 'Teams Permissions'
    })
  }
</script>
