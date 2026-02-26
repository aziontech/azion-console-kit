<script setup>
  import { computed, inject } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { COLUMN_STYLES, columnStyles } from '@/helpers/column-styles'
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

  const actions = computed(() => [
    {
      label: 'Delete',
      type: 'delete',
      title: 'user',
      icon: 'pi pi-trash',
      service: props.deleteUsersService
    }
  ])

  const getColumns = computed(() => {
    return [
      {
        field: 'firstName',
        header: 'First Name',
        sortField: 'first_name',
        style: columnStyles.priority(2, 150, 250)
      },
      {
        field: 'lastName',
        header: 'Last Name',
        sortField: 'last_name',
        style: columnStyles.priority(2, 150, 250)
      },
      {
        field: 'email',
        header: 'Email Address',
        style: columnStyles.priority(3, 200, 300)
      },
      {
        field: 'teams',
        header: 'Teams',
        disableSort: true,
        type: 'component',
        style: columnStyles.priority(3, 200, 300),
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'text-array-with-popup'
          })
      },
      {
        field: 'mfa',
        header: 'MFA',
        type: 'component',
        disableSort: true,
        style: COLUMN_STYLES.FIT_CONTENT,
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
        style: COLUMN_STYLES.FIT_CONTENT,
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
        style: COLUMN_STYLES.FIT_CONTENT,
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
        }
      }
    ]
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
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Users Management"
        description="Manage users with access to the account and control authentication and permissions."
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
        :frozenColumns="['firstName']"
        exportFileName="Users"
        :csvMapper="csvMapper"
        hideLastModifiedColumn
        :emptyBlock="{
          title: 'No users yet',
          description: 'Create your first additional user to grant access to the account.',
          createButtonLabel: 'User',
          createPagePath: 'users/create',
          documentationService: documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
