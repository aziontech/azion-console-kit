<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Multi-Factor Authentication Management" />
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        :listService="mafService.listMfaService"
        :columns="getColumns"
        @on-load-data="handleLoadData"
        emptyListMessage="No MFA users found."
        :actions="actions"
        :apiFields="MFA_USERS_API_FIELDS"
        :enableEditClick="false"
      />
      <EmptyResultsBlock
        v-else
        title="No MFA Management found."
        description=""
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
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { computed, ref } from 'vue'
  import { mafService } from '@/services/v2'
  defineProps({
    documentationService: {
      type: Function,
      required: true
    }
  })

  const hasContentToList = ref(true)

  const MFA_USERS_API_FIELDS = ['id', 'name', 'confirmed', 'user_id']

  const actions = [
    {
      type: 'delete',
      title: 'MFA',
      icon: 'pi pi-trash',
      service: mafService.deleteMfaService
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
