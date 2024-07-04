<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block/action-column.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, ref } from 'vue'

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

  const hasContentToList = ref(true)
  const pageTitle = 'Users'
  const actions = [
    {
      type: 'delete',
      title: 'user',
      icon: 'pi pi-trash',
      service: props.deleteUsersService
    }
  ]

  const getColumns = computed(() => [
    {
      field: 'firstName',
      header: 'First Name'
    },
    {
      field: 'lastName',
      header: 'Last Name'
    },
    {
      field: 'email',
      header: 'Email Address'
    },
    {
      field: 'teams',
      header: 'Teams'
    },
    {
      field: 'mfa',
      header: 'MFA',
      type: 'component',
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
      filterPath: 'status.content',
      type: 'component',
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
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      }
    }
  ])

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="pageTitle"
        data-testid="users__list-view__page-heading"
      />
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listUsersService"
        :columns="getColumns"
        addButtonLabel="User"
        createPagePath="users/create"
        editPagePath="users/edit"
        @on-load-data="handleLoadData"
        emptyListMessage="No users found."
        :actions="actions"
      />
      <EmptyResultsBlock
        v-else
        title="No user has been created"
        description=" Click the button below to create your first user."
        createButtonLabel="User"
        createPagePath="users/create"
        :documentationService="documentationService"
        data-testid="users__list-view__empty-results-block"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>
