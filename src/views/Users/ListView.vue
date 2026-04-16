<script setup>
  import { computed, inject, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import ListTable from '@/components/list-table'
  import { DataTableActionsButtons } from '@/components/list-table'

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

  const router = useRouter()
  const listTableRef = ref()

  const handleNavigateToCreate = () => {
    router.push('users/create')
  }

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

  const getColumns = computed(() => {
    return [
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
        disableSort: true,
        type: 'component',
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
    ]
  })

  const emit = defineEmits(['on-load-data', 'on-before-go-to-add-page', 'on-before-go-to-edit'])
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
      <ListTable
        ref="listTableRef"
        :listService="props.listUsersService"
        :columns="getColumns"
        :actions="actions"
        editPagePath="/users/edit"
        defaultOrderingFieldName="-last_modified"
        :frozenColumns="['firstName']"
        exportFileName="Users"
        :csvMapper="csvMapper"
        :lazy="true"
        emptyListMessage="No users found."
        :hideLastModifiedColumn="true"
        :emptyBlock="{
          title: 'No users yet',
          description: 'Create your first additional user to grant access to the account.',
          createButtonLabel: 'User',
          documentationService: documentationService
        }"
        @click-to-create="handleNavigateToCreate"
        @on-load-data="emit('on-load-data', $event)"
        @on-before-go-to-add-page="handleTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
      />
    </template>
  </ContentBlock>
</template>
