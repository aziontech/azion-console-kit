<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Multi-Factor Authentication Management" />
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        :listService="listMfaUsersService"
        :columns="getColumns"
        addButtonLabel="MFA"
        createPagePath="mfa-management/create"
        editPagePath="mfa-management/edit"
        @on-load-data="handleLoadData"
        emptyListMessage="No MFA users found."
        :actions="actions"
        :apiFields="MFA_USERS_API_FIELDS"
      />
      <EmptyResultsBlock
        v-else
        title="No MFA users found."
        description="Click the button below to create your first MFA user."
        createButtonLabel="MFA"
        createPagePath="mfa-management/create"
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
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { computed, ref } from 'vue'

  const props = defineProps({
    listMfaUsersService: {
      type: Function,
      required: true
    },
    deleteMfaService: {
      type: Function,
      required: true
    }
  })

  const hasContentToList = ref(true)

  const MFA_USERS_API_FIELDS = ['id', 'name', 'confirmed']

  const actions = [
    {
      type: 'delete',
      title: 'MFA',
      icon: 'pi pi-trash',
      service: props.deleteMfaService
    }
  ]

  const getColumns = computed(() => [
    {
      field: 'email',
      header: 'Email',
      sortField: 'name'
    },
    {
      field: 'confirmed',
      header: 'Status',
      sortField: 'confirmed',
      filterPath: 'confirmed.content',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      }
    }
  ])

  function handleLoadData(event) {
    hasContentToList.value = event
  }
</script>
