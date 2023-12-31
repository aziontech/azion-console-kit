<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock :pageTitle="pageTitle"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="props.listUsersService"
        :deleteService="props.deleteUsersService"
        :columns="getColumns"
        pageTitleDelete="Users"
        addButtonLabel="Add"
        createPagePath="users/create"
        editPagePath="users/edit"
        @on-load-data="handleLoadData"
      />
      <EmptyResultsBlock
        v-else
        title="No user has been created"
        description=" Click the button below to initiate the setup process and create your first user."
        createButtonLabel="Add"
        createPagePath="users/create"
        :documentationService="props.documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import ListTableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

  const hasContentToList = ref(true)
  const pageTitle = 'Users'
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
