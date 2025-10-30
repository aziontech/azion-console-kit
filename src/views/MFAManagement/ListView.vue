<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { computed } from 'vue'
  import { mfaService } from '@/services/v2/mfa/mfa-service'
  defineProps({
    documentationService: {
      type: Function,
      required: true
    }
  })

  const MFA_USERS_API_FIELDS = ['id', 'name', 'confirmed', 'user_id']

  const actions = [
    {
      type: 'delete',
      title: 'MFA',
      icon: 'pi pi-trash',
      service: mfaService.deleteMfaService
    }
  ]

  const csvMapper = (rowData) => {
    return {
      email: rowData.email,
      confirmed: rowData.data?.content || rowData.confirmed
    }
  }

  const getColumns = computed(() => [
    {
      field: 'email',
      header: 'Email',
      sortField: 'name',
      type: 'component',
      style: 'max-width: 240px',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'text-format-with-popup'
        })
      }
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
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Multi-Factor Authentication Management" />
    </template>
    <template #content>
      <FetchListTableBlock
        :listService="mafService.listMfaService"
        :columns="getColumns"
        emptyListMessage="No MFA users found."
        :actions="actions"
        :apiFields="MFA_USERS_API_FIELDS"
        :enableEditClick="false"
        exportFileName="Multi-Factor Authentication Management"
        :csvMapper="csvMapper"
        hideLastModifiedColumn
        :emptyBlock="{
          title: 'No MFA Management found.',
          description: '',
          documentationService: documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
