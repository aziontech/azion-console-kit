<script setup>
  import { computed } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { mfaService } from '@/services/v2/mfa/mfa-service'
  import { COLUMN_STYLES, columnStyles } from '@/helpers/column-styles'
  defineProps({
    documentationService: {
      type: Function,
      required: true
    }
  })

  const MFA_USERS_API_FIELDS = ['id', 'name', 'confirmed', 'user_id', 'email']

  const actions = [
    {
      label: 'Delete',
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
      field: 'name',
      header: 'Name',
      sortField: 'name',
      style: columnStyles.priority(2, 200, 350)
    },
    {
      field: 'email',
      header: 'Email',
      sortField: 'email',
      type: 'component',
      style: columnStyles.priority(3, 200, 300),
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
      style: COLUMN_STYLES.FIT_CONTENT,
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
        pageTitle="Multi-Factor Authentication Management"
        description="Define and manage multi-factor authentication settings for account security."
      />
    </template>
    <template #content>
      <FetchListTableBlock
        :listService="mfaService.listMfaService"
        :columns="getColumns"
        emptyListMessage="No MFA users found."
        :actions="actions"
        :apiFields="MFA_USERS_API_FIELDS"
        :enableEditClick="false"
        exportFileName="Multi-Factor Authentication Management"
        :csvMapper="csvMapper"
        hideLastModifiedColumn
        :emptyBlock="{
          title: 'No MFA configurations yet',
          description: 'Create your first MFA configuration to enhance account security.',
          documentationService: documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
