<script setup>
  import ContentBlock from '@/templates/content-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'

  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, inject } from 'vue'
  import { DataTableActionsButtons } from '@/components/DataTable'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    listUsersService: {
      required: true,
      type: Function
    },
    deleteUsersService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const handleTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'User'
    })
  }

  const handleTrackEditEvent = () => {
    tracker.product.clickToEdit({
      productName: 'User'
    })
  }

  const actions = [
    {
      label: 'Delete',
      type: 'delete',
      title: 'user',
      icon: 'pi pi-trash',
      service: props.deleteUsersService
    }
  ]

  const USERS_API_FIELDS = [
    'id',
    'first_name',
    'last_name',
    'email',
    'teams',
    'two_factor_enabled',
    'is_active',
    'is_account_owner',
    'last_modified'
  ]

  const csvMapper = (rowData) => {
    return {
      firstName: rowData.firstName,
      lastName: rowData.lastName,
      email: rowData.email,
      teams: rowData.teams,
      mfa: rowData.mfa?.content || rowData.mfa,
      owner: rowData.owner?.content || rowData.owner,
      status: rowData.status?.content || rowData.status
    }
  }

  const getColumns = computed(() => [
    {
      field: 'firstName',
      header: 'First Name',
      sortField: 'first_name'
    },
    {
      field: 'lastName',
      header: 'Last Name',
      sortField: 'last_name'
    },
    {
      field: 'email',
      header: 'Email Address'
    },
    {
      field: 'teams',
      header: 'Teams',
      disableSort: true
    },
    {
      field: 'mfa',
      header: 'MFA',
      type: 'component',
      disableSort: true,
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      }
    },
    {
      field: 'owner',
      header: 'Account Owner',
      filterPath: 'owner.content',
      type: 'component',
      disableSort: true,
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      }
    },
    {
      field: 'status',
      header: 'Status',
      disableSort: true,
      filterPath: 'status.content',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      }
    }
  ])
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Users"
        description="Manage users and define access levels."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="User"
            @click="handleTrackEvent"
            createPagePath="users/create"
            data-testid="create_User_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        :listService="listUsersService"
        :columns="getColumns"
        editPagePath="/users/edit"
        @on-before-go-to-add-page="handleTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        emptyListMessage="No users found."
        :actions="actions"
        :defaultOrderingFieldName="'-last_modified'"
        :apiFields="USERS_API_FIELDS"
        :frozenColumns="['firstName']"
        exportFileName="Users"
        :csvMapper="csvMapper"
        hideLastModifiedColumn
        :emptyBlock="{
          title: 'No user has been created',
          description: ' Click the button below to create your first user.',
          createButtonLabel: 'User',
          createPagePath: 'users/create',
          documentationService: documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
